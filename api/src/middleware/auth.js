const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/stocktake',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-super-secret-jwt-key-here-change-in-production');
    
    // Verify user still exists and is active
    const userResult = await pool.query(
      'SELECT id, email, role, store_id, warehouse_id, is_active FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (userResult.rows.length === 0 || !userResult.rows[0].is_active) {
      return res.status(401).json({ error: 'Invalid or inactive user' });
    }

    const user = userResult.rows[0];
    req.user = {
      userId: user.id,
      email: user.email,
      role: user.role,
      storeId: user.store_id,
      warehouseId: user.warehouse_id
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    next(error);
  }
};

const requireRole = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        required: roles,
        current: req.user.role
      });
    }
    next();
  };
};

module.exports = {
  authenticateToken,
  requireRole
};