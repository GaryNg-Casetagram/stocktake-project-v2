const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
const Joi = require('joi');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/stocktake',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Validation schemas
const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required()
});

const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  firstName: Joi.string().min(2).max(100).required(),
  lastName: Joi.string().min(2).max(100).required(),
  role: Joi.string().valid('retail_staff', 'retail_manager', 'warehouse_staff', 'retail_backend', 'tech_admin').required(),
  storeId: Joi.string().uuid().optional(),
  warehouseId: Joi.string().uuid().optional()
});

// Login endpoint
const login = async (req, res, next) => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { email, password } = value;

    // Find user by email
    const userResult = await pool.query(
      'SELECT id, email, password_hash, first_name, last_name, role, store_id, warehouse_id, is_active FROM users WHERE email = $1',
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = userResult.rows[0];

    if (!user.is_active) {
      return res.status(401).json({ error: 'Account is deactivated' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role,
        storeId: user.store_id,
        warehouseId: user.warehouse_id
      },
      process.env.JWT_SECRET || 'your-super-secret-jwt-key-here-change-in-production',
      { expiresIn: '24h' }
    );

    // Log login action
    await pool.query(
      'INSERT INTO audit_logs (user_id, action, details) VALUES ($1, $2, $3)',
      [user.id, 'login', JSON.stringify({ timestamp: new Date().toISOString() })]
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        storeId: user.store_id,
        warehouseId: user.warehouse_id
      }
    });

  } catch (error) {
    next(error);
  }
};

// Register endpoint (admin only)
const register = async (req, res, next) => {
  try {
    // Check if user has admin privileges
    if (!['tech_admin', 'retail_backend'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { email, password, firstName, lastName, role, storeId, warehouseId } = value;

    // Check if user already exists
    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'User already exists' });
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role, store_id, warehouse_id) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING id, email, first_name, last_name, role, store_id, warehouse_id, created_at`,
      [email, passwordHash, firstName, lastName, role, storeId, warehouseId]
    );

    const newUser = result.rows[0];

    // Log user creation
    await pool.query(
      'INSERT INTO audit_logs (user_id, action, details) VALUES ($1, $2, $3)',
      [req.user.userId, 'user_created', JSON.stringify({ 
        targetUserId: newUser.id, 
        targetEmail: newUser.email,
        role: newUser.role 
      })]
    );

    res.status(201).json({
      user: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.first_name,
        lastName: newUser.last_name,
        role: newUser.role,
        storeId: newUser.store_id,
        warehouseId: newUser.warehouse_id,
        createdAt: newUser.created_at
      }
    });

  } catch (error) {
    next(error);
  }
};

// Refresh token endpoint
const refreshToken = async (req, res, next) => {
  try {
    const { userId, email, role, storeId, warehouseId } = req.user;

    const newToken = jwt.sign(
      { userId, email, role, storeId, warehouseId },
      process.env.JWT_SECRET || 'your-super-secret-jwt-key-here-change-in-production',
      { expiresIn: '24h' }
    );

    res.json({ token: newToken });

  } catch (error) {
    next(error);
  }
};

// Logout endpoint
const logout = async (req, res, next) => {
  try {
    // Log logout action
    await pool.query(
      'INSERT INTO audit_logs (user_id, action, details) VALUES ($1, $2, $3)',
      [req.user.userId, 'logout', JSON.stringify({ timestamp: new Date().toISOString() })]
    );

    res.json({ message: 'Logged out successfully' });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  login,
  register,
  refreshToken,
  logout
};