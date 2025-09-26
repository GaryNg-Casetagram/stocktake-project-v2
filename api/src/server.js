// Load environment variables
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();

// Environment configuration
const PORT = process.env.PORT || 3005;
const NODE_ENV = process.env.NODE_ENV || 'development';
const JWT_SECRET = process.env.JWT_SECRET || 'demo-secret-key-change-this-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:19006', 'http://localhost:3006'];
const RATE_LIMIT_WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000; // 15 minutes
const RATE_LIMIT_MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100;
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';
const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS) || 10;

// In-memory database for demo
const users = [
  {
    id: '1',
    email: 'admin@stocktake.com',
    password: '$2a$10$hb8HtG1DTYeuj0ZxIww8AOKn53eHj0DRJkpnpVedC.b/NTYhc76zy', // password123
    firstName: 'System',
    lastName: 'Admin',
    role: 'superadmin',
    storeId: null,
    warehouseId: null,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    lastLogin: '2024-01-15T10:30:00Z'
  },
  {
    id: '2',
    email: 'manager.central@stocktake.com',
    password: '$2a$10$hb8HtG1DTYeuj0ZxIww8AOKn53eHj0DRJkpnpVedC.b/NTYhc76zy', // password123
    firstName: 'John',
    lastName: 'Smith',
    role: 'retail_manager',
    storeId: 'store-1',
    warehouseId: null,
    isActive: true,
    createdAt: '2024-01-02T00:00:00Z',
    lastLogin: '2024-01-14T15:20:00Z'
  },
  {
    id: '3',
    email: 'warehouse.manager@stocktake.com',
    password: '$2a$10$hb8HtG1DTYeuj0ZxIww8AOKn53eHj0DRJkpnpVedC.b/NTYhc76zy', // password123
    firstName: 'Sarah',
    lastName: 'Johnson',
    role: 'warehouse_manager',
    storeId: null,
    warehouseId: 'warehouse-1',
    isActive: true,
    createdAt: '2024-01-03T00:00:00Z',
    lastLogin: '2024-01-13T09:15:00Z'
  },
  {
    id: '4',
    email: 'staff.eastside@stocktake.com',
    password: '$2a$10$hb8HtG1DTYeuj0ZxIww8AOKn53eHj0DRJkpnpVedC.b/NTYhc76zy', // password123
    firstName: 'Mike',
    lastName: 'Davis',
    role: 'staff',
    storeId: 'store-2',
    warehouseId: null,
    isActive: true,
    createdAt: '2024-01-04T00:00:00Z',
    lastLogin: '2024-01-12T14:45:00Z'
  },
  {
    id: '5',
    email: 'staff.westside@stocktake.com',
    password: '$2a$10$hb8HtG1DTYeuj0ZxIww8AOKn53eHj0DRJkpnpVedC.b/NTYhc76zy', // password123
    firstName: 'Lisa',
    lastName: 'Wilson',
    role: 'staff',
    storeId: 'store-1',
    warehouseId: null,
    isActive: true,
    createdAt: '2024-01-05T00:00:00Z',
    lastLogin: '2024-01-11T11:30:00Z'
  },
  {
    id: '6',
    email: 'inactive.user@stocktake.com',
    password: '$2a$10$hb8HtG1DTYeuj0ZxIww8AOKn53eHj0DRJkpnpVedC.b/NTYhc76zy', // password123
    firstName: 'Tom',
    lastName: 'Brown',
    role: 'staff',
    storeId: 'store-3',
    warehouseId: null,
    isActive: false,
    createdAt: '2024-01-06T00:00:00Z',
    lastLogin: '2024-01-10T16:20:00Z'
  }
];

const items = [
  {
    id: '1',
    sku: 'CTF-C-CIM-242614E67PMBL',
    shortId: 'CTF001',
    name: 'Premium Camera Lens 24mm',
    description: 'High-quality camera lens with advanced optics',
    hasRfid: true,
    category: 'Electronics',
    unitPrice: 299.99,
    storeId: 'store-1',
    warehouseId: 'warehouse-1',
    isActive: true
  },
  {
    id: '2',
    sku: 'CTF-C-CIM-242614E67PMBL-4',
    shortId: 'CTF004',
    name: 'Camera Strap Leather',
    description: 'Genuine leather camera strap with quick release',
    hasRfid: false,
    category: 'Accessories',
    unitPrice: 45.99,
    storeId: 'store-1',
    warehouseId: 'warehouse-1',
    isActive: true
  },
  {
    id: '3',
    sku: 'CTF-C-CIM-242614E67PMBL-5',
    shortId: 'CTF005',
    name: 'Professional Tripod',
    description: 'Heavy-duty aluminum tripod with ball head',
    hasRfid: true,
    category: 'Accessories',
    unitPrice: 189.99,
    storeId: 'store-2',
    warehouseId: 'warehouse-2',
    isActive: true
  },
  {
    id: '4',
    sku: 'CTF-C-CIM-242614E67PMBL-6',
    shortId: 'CTF006',
    name: 'Memory Card 64GB',
    description: 'High-speed SDXC memory card for professional use',
    hasRfid: false,
    category: 'Electronics',
    unitPrice: 79.99,
    storeId: 'store-1',
    warehouseId: 'warehouse-1',
    isActive: true
  },
  {
    id: '5',
    sku: 'CTF-C-CIM-242614E67PMBL-7',
    shortId: 'CTF007',
    name: 'Camera Bag Pro',
    description: 'Waterproof camera bag with multiple compartments',
    hasRfid: false,
    category: 'Accessories',
    unitPrice: 129.99,
    storeId: 'store-3',
    warehouseId: 'warehouse-3',
    isActive: true
  },
  {
    id: '6',
    sku: 'CTF-C-CIM-242614E67PMBL-8',
    shortId: 'CTF008',
    name: 'External Flash Unit',
    description: 'Professional external flash with TTL metering',
    hasRfid: true,
    category: 'Electronics',
    unitPrice: 249.99,
    storeId: 'store-2',
    warehouseId: 'warehouse-2',
    isActive: true
  },
  {
    id: '7',
    sku: 'CTF-C-CIM-242614E67PMBL-9',
    shortId: 'CTF009',
    name: 'Lens Cleaning Kit',
    description: 'Complete lens cleaning kit with microfiber cloths',
    hasRfid: false,
    category: 'Accessories',
    unitPrice: 24.99,
    storeId: 'store-4',
    warehouseId: 'warehouse-4',
    isActive: true
  },
  {
    id: '8',
    sku: 'CTF-C-CIM-242614E67PMBL-10',
    shortId: 'CTF010',
    name: 'Camera Body Cap',
    description: 'Protective body cap for camera when lens is removed',
    hasRfid: false,
    category: 'Accessories',
    unitPrice: 12.99,
    storeId: 'store-5',
    warehouseId: 'warehouse-5',
    isActive: true
  },
  {
    id: '9',
    sku: 'CTF-C-CIM-242614E67PMBL-11',
    shortId: 'CTF011',
    name: 'Wireless Remote Control',
    description: 'Wireless remote control for camera operation',
    hasRfid: true,
    category: 'Electronics',
    unitPrice: 89.99,
    storeId: 'store-6',
    warehouseId: 'warehouse-1',
    isActive: true
  },
  {
    id: '10',
    sku: 'CTF-C-CIM-242614E67PMBL-12',
    shortId: 'CTF012',
    name: 'Camera Battery Pack',
    description: 'High-capacity rechargeable battery pack',
    hasRfid: true,
    category: 'Electronics',
    unitPrice: 149.99,
    storeId: 'store-1',
    warehouseId: 'warehouse-2',
    isActive: true
  }
];

const sessions = [
  {
    id: 'session-demo-1',
    name: 'Q4 Stocktake Session',
    type: 'retail',
    status: 'active',
    storeId: 'store-1',
    warehouseId: null,
    createdBy: '1',
    startedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    metadata: {}
  },
  {
    id: 'session-demo-2',
    name: 'Warehouse Cycle Count',
    type: 'warehouse',
    status: 'completed',
    storeId: null,
    warehouseId: 'warehouse-1',
    createdBy: '1',
    startedAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    metadata: {}
  },
  {
    id: 'session-demo-3',
    name: 'Spot Check Audit',
    type: 'audit',
    status: 'paused',
    storeId: 'store-2',
    warehouseId: null,
    createdBy: '1',
    startedAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    metadata: {}
  },
  {
    id: 'session-demo-4',
    name: 'Full Inventory Count',
    type: 'inventory',
    status: 'completed',
    storeId: null,
    warehouseId: 'warehouse-2',
    createdBy: '1',
    startedAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    metadata: {}
  },
  {
    id: 'session-demo-5',
    name: 'Partial Recount',
    type: 'recount',
    status: 'cancelled',
    storeId: 'store-3',
    warehouseId: null,
    createdBy: '1',
    startedAt: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
    createdAt: new Date(Date.now() - 259200000).toISOString(),
    metadata: {}
  }
];

// Locations database
const locations = [
  {
    id: 'store-1',
    name: 'Central Store',
    type: 'store',
    address: '123 Main Street, Downtown',
    city: 'New York',
    state: 'NY',
    zipCode: '10001',
    country: 'USA',
    phone: '+1-555-0123',
    email: 'central@stocktake.com',
    manager: 'John Smith',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'warehouse-1',
    name: 'Main Warehouse',
    type: 'warehouse',
    address: '456 Industrial Blvd',
    city: 'Newark',
    state: 'NJ',
    zipCode: '07105',
    country: 'USA',
    phone: '+1-555-0456',
    email: 'warehouse@stocktake.com',
    manager: 'Sarah Johnson',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'store-2',
    name: 'Westside Store',
    type: 'store',
    address: '789 West Avenue',
    city: 'Los Angeles',
    state: 'CA',
    zipCode: '90210',
    country: 'USA',
    phone: '+1-555-0789',
    email: 'westside@stocktake.com',
    manager: 'Mike Davis',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'warehouse-2',
    name: 'Distribution Center',
    type: 'warehouse',
    address: '321 Logistics Way',
    city: 'Chicago',
    state: 'IL',
    zipCode: '60601',
    country: 'USA',
    phone: '+1-555-0321',
    email: 'distribution@stocktake.com',
    manager: 'Lisa Chen',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'store-3',
    name: 'Downtown Flagship',
    type: 'store',
    address: '555 Business District',
    city: 'Miami',
    state: 'FL',
    zipCode: '33101',
    country: 'USA',
    phone: '+1-555-0555',
    email: 'flagship@stocktake.com',
    manager: 'Carlos Rodriguez',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'warehouse-3',
    name: 'Regional Hub',
    type: 'warehouse',
    address: '999 Supply Chain Blvd',
    city: 'Dallas',
    state: 'TX',
    zipCode: '75201',
    country: 'USA',
    phone: '+1-555-0999',
    email: 'regional@stocktake.com',
    manager: 'Jennifer Wilson',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'store-4',
    name: 'Metro Outlet',
    type: 'store',
    address: '777 Shopping Plaza',
    city: 'Seattle',
    state: 'WA',
    zipCode: '98101',
    country: 'USA',
    phone: '+1-555-0777',
    email: 'metro@stocktake.com',
    manager: 'David Kim',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'store-5',
    name: 'Suburban Branch',
    type: 'store',
    address: '444 Community Center',
    city: 'Denver',
    state: 'CO',
    zipCode: '80201',
    country: 'USA',
    phone: '+1-555-0444',
    email: 'suburban@stocktake.com',
    manager: 'Amanda Taylor',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'warehouse-4',
    name: 'Cold Storage Facility',
    type: 'warehouse',
    address: '888 Refrigeration Row',
    city: 'Phoenix',
    state: 'AZ',
    zipCode: '85001',
    country: 'USA',
    phone: '+1-555-0888',
    email: 'coldstorage@stocktake.com',
    manager: 'Robert Martinez',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'store-6',
    name: 'Airport Terminal Store',
    type: 'store',
    address: 'Terminal 2, Gate A15',
    city: 'Atlanta',
    state: 'GA',
    zipCode: '30320',
    country: 'USA',
    phone: '+1-555-0666',
    email: 'airport@stocktake.com',
    manager: 'Patricia Brown',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'warehouse-5',
    name: 'Cross-Dock Facility',
    type: 'warehouse',
    address: '222 Transit Hub',
    city: 'Portland',
    state: 'OR',
    zipCode: '97201',
    country: 'USA',
    phone: '+1-555-0222',
    email: 'crossdock@stocktake.com',
    manager: 'Michael Thompson',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Security middleware
app.use(helmet());
app.use(cors({
  origin: ALLOWED_ORIGINS,
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: RATE_LIMIT_MAX_REQUESTS,
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = users.find(u => u.id === decoded.userId);
    
    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Invalid or inactive user' });
    }

    req.user = {
      userId: user.id,
      email: user.email,
      role: user.role,
      storeId: user.storeId,
      warehouseId: user.warehouseId
    };

    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = users.find(u => u.email === email);
    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role,
        storeId: user.storeId,
        warehouseId: user.warehouseId
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        storeId: user.storeId,
        warehouseId: user.warehouseId
      }
    });

  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get items endpoint
app.get('/api/items', authenticateToken, (req, res) => {
  const { storeId, warehouseId, search, page = 1, limit = 20 } = req.query;
  
  let filteredItems = items.filter(item => item.isActive);
  
  if (storeId) {
    filteredItems = filteredItems.filter(item => item.storeId === storeId);
  }
  
  if (warehouseId) {
    filteredItems = filteredItems.filter(item => item.warehouseId === warehouseId);
  }
  
  if (search) {
    const searchLower = search.toLowerCase();
    filteredItems = filteredItems.filter(item => 
      item.name.toLowerCase().includes(searchLower) ||
      item.sku.toLowerCase().includes(searchLower) ||
      item.shortId.toLowerCase().includes(searchLower)
    );
  }

  // Pagination
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + parseInt(limit);
  const paginatedItems = filteredItems.slice(startIndex, endIndex);

  res.json({
    data: paginatedItems,
    total: filteredItems.length,
    page: parseInt(page),
    limit: parseInt(limit),
    totalPages: Math.ceil(filteredItems.length / limit)
  });
});

// Get locations endpoint
app.get('/api/locations', authenticateToken, (req, res) => {
  const { type, search, page = 1, limit = 20 } = req.query;
  
  let filteredLocations = locations.filter(location => location.isActive);
  
  if (type) {
    filteredLocations = filteredLocations.filter(location => location.type === type);
  }
  
  if (search) {
    const searchLower = search.toLowerCase();
    filteredLocations = filteredLocations.filter(location => 
      location.name.toLowerCase().includes(searchLower) ||
      location.city.toLowerCase().includes(searchLower) ||
      location.state.toLowerCase().includes(searchLower) ||
      location.manager.toLowerCase().includes(searchLower)
    );
  }

  // Pagination
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + parseInt(limit);
  const paginatedLocations = filteredLocations.slice(startIndex, endIndex);

  res.json({
    data: paginatedLocations,
    total: filteredLocations.length,
    page: parseInt(page),
    limit: parseInt(limit),
    totalPages: Math.ceil(filteredLocations.length / limit)
  });
});

// Get single location endpoint
app.get('/api/locations/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const location = locations.find(l => l.id === id && l.isActive);
  
  if (!location) {
    return res.status(404).json({ error: 'Location not found' });
  }
  
  res.json({ data: location });
});

// Create location endpoint
app.post('/api/locations', authenticateToken, (req, res) => {
  const { name, type, address, city, state, zipCode, country, phone, email, manager } = req.body;
  
  if (!name || !type || !address || !city || !state) {
    return res.status(400).json({ error: 'Name, type, address, city, and state are required' });
  }
  
  const newLocation = {
    id: `location-${Date.now()}`,
    name,
    type,
    address,
    city,
    state,
    zipCode: zipCode || '',
    country: country || 'USA',
    phone: phone || '',
    email: email || '',
    manager: manager || '',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  locations.push(newLocation);
  
  res.status(201).json({
    data: newLocation,
    message: 'Location created successfully'
  });
});

// Update location endpoint
app.put('/api/locations/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { name, type, address, city, state, zipCode, country, phone, email, manager, isActive } = req.body;
  
  const locationIndex = locations.findIndex(l => l.id === id);
  
  if (locationIndex === -1) {
    return res.status(404).json({ error: 'Location not found' });
  }
  
  const updatedLocation = {
    ...locations[locationIndex],
    name: name || locations[locationIndex].name,
    type: type || locations[locationIndex].type,
    address: address || locations[locationIndex].address,
    city: city || locations[locationIndex].city,
    state: state || locations[locationIndex].state,
    zipCode: zipCode !== undefined ? zipCode : locations[locationIndex].zipCode,
    country: country || locations[locationIndex].country,
    phone: phone || locations[locationIndex].phone,
    email: email || locations[locationIndex].email,
    manager: manager || locations[locationIndex].manager,
    isActive: isActive !== undefined ? isActive : locations[locationIndex].isActive,
    updatedAt: new Date().toISOString()
  };
  
  locations[locationIndex] = updatedLocation;
  
  res.json({
    data: updatedLocation,
    message: 'Location updated successfully'
  });
});

// Delete location endpoint
app.delete('/api/locations/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const locationIndex = locations.findIndex(l => l.id === id);
  
  if (locationIndex === -1) {
    return res.status(404).json({ error: 'Location not found' });
  }
  
  // Soft delete
  locations[locationIndex].isActive = false;
  locations[locationIndex].updatedAt = new Date().toISOString();
  
  res.json({
    message: 'Location deleted successfully'
  });
});

// Sessions endpoints
app.get('/api/sessions', authenticateToken, (req, res) => {
  const { status, type, storeId, warehouseId } = req.query;
  
  let filteredSessions = sessions;
  
  if (status) {
    filteredSessions = filteredSessions.filter(session => session.status === status);
  }
  
  if (type) {
    filteredSessions = filteredSessions.filter(session => session.type === type);
  }
  
  if (storeId) {
    filteredSessions = filteredSessions.filter(session => session.storeId === storeId);
  }
  
  if (warehouseId) {
    filteredSessions = filteredSessions.filter(session => session.warehouseId === warehouseId);
  }

  res.json({
    data: filteredSessions,
    total: filteredSessions.length
  });
});

app.post('/api/sessions', authenticateToken, (req, res) => {
  const { name, type, storeId, warehouseId, metadata } = req.body;
  
  if (!name || !type) {
    return res.status(400).json({ error: 'Name and type are required' });
  }
  
  const newSession = {
    id: `session-${Date.now()}`,
    name,
    type,
    status: 'active',
    storeId: storeId || 'store-1',
    warehouseId: warehouseId || 'warehouse-1',
    createdBy: req.user.userId,
    startedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    metadata: metadata || {}
  };
  
  sessions.push(newSession);
  
  res.status(201).json({
    data: newSession,
    message: 'Session created successfully'
  });
});

// Get single item endpoint
app.get('/api/items/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const item = items.find(i => i.id === id && i.isActive);
  
  if (!item) {
    return res.status(404).json({ error: 'Item not found' });
  }
  
  res.json({ data: item });
});

// Get item by SKU endpoint
app.get('/api/items/sku/:sku', authenticateToken, (req, res) => {
  const { sku } = req.params;
  const item = items.find(i => i.sku === sku && i.isActive);
  
  if (!item) {
    return res.status(404).json({ error: 'Item not found' });
  }
  
  res.json({ data: item });
});

// Create item endpoint
app.post('/api/items', authenticateToken, (req, res) => {
  const { sku, shortId, name, description, category, unitPrice, hasRfid, storeId, warehouseId } = req.body;
  
  if (!sku || !shortId || !name || !category || !unitPrice || !storeId || !warehouseId) {
    return res.status(400).json({ error: 'SKU, Short ID, Name, Category, Unit Price, Store ID, and Warehouse ID are required' });
  }
  
  // Check if SKU already exists
  const existingItem = items.find(i => i.sku === sku);
  if (existingItem) {
    return res.status(400).json({ error: 'Item with this SKU already exists' });
  }
  
  const newItem = {
    id: `item-${Date.now()}`,
    sku,
    shortId,
    name,
    description: description || '',
    hasRfid: hasRfid || false,
    category,
    unitPrice: parseFloat(unitPrice),
    storeId,
    warehouseId,
    isActive: true
  };
  
  items.push(newItem);
  
  res.status(201).json({
    data: newItem,
    message: 'Item created successfully'
  });
});

// Update item endpoint
app.put('/api/items/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { sku, shortId, name, description, category, unitPrice, hasRfid, storeId, warehouseId, isActive } = req.body;
  
  const itemIndex = items.findIndex(i => i.id === id);
  
  if (itemIndex === -1) {
    return res.status(404).json({ error: 'Item not found' });
  }
  
  // Check if SKU already exists (excluding current item)
  if (sku && sku !== items[itemIndex].sku) {
    const existingItem = items.find(i => i.sku === sku && i.id !== id);
    if (existingItem) {
      return res.status(400).json({ error: 'Item with this SKU already exists' });
    }
  }
  
  const updatedItem = {
    ...items[itemIndex],
    sku: sku || items[itemIndex].sku,
    shortId: shortId || items[itemIndex].shortId,
    name: name || items[itemIndex].name,
    description: description !== undefined ? description : items[itemIndex].description,
    category: category || items[itemIndex].category,
    unitPrice: unitPrice !== undefined ? parseFloat(unitPrice) : items[itemIndex].unitPrice,
    hasRfid: hasRfid !== undefined ? hasRfid : items[itemIndex].hasRfid,
    storeId: storeId || items[itemIndex].storeId,
    warehouseId: warehouseId || items[itemIndex].warehouseId,
    isActive: isActive !== undefined ? isActive : items[itemIndex].isActive
  };
  
  items[itemIndex] = updatedItem;
  
  res.json({
    data: updatedItem,
    message: 'Item updated successfully'
  });
});

// Delete item endpoint
app.delete('/api/items/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const itemIndex = items.findIndex(i => i.id === id);
  
  if (itemIndex === -1) {
    return res.status(404).json({ error: 'Item not found' });
  }
  
  // Soft delete
  items[itemIndex].isActive = false;
  
  res.json({
    message: 'Item deleted successfully'
  });
});

// Bulk labels generation endpoint
app.post('/api/labels/bulk', authenticateToken, (req, res) => {
  const { itemIds, format = 'zip' } = req.body;
  
  if (!itemIds || !Array.isArray(itemIds) || itemIds.length === 0) {
    return res.status(400).json({ error: 'Item IDs array is required' });
  }
  
  // Find items by IDs
  const selectedItems = items.filter(item => 
    itemIds.includes(item.id) && item.isActive
  );
  
  if (selectedItems.length === 0) {
    return res.status(404).json({ error: 'No valid items found' });
  }
  
  // Generate labels data
  const labels = selectedItems.map(item => ({
    id: item.id,
    sku: item.sku,
    shortId: item.shortId,
    name: item.name,
    description: item.description,
    category: item.category,
    unitPrice: item.unitPrice,
    hasRfid: item.hasRfid,
    qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(item.sku)}`,
    barcode: `https://barcode.tec-it.com/barcode.ashx?data=${item.shortId}&code=Code128&translate-esc=on`,
    generatedAt: new Date().toISOString()
  }));
  
  if (format === 'json') {
    res.json({
      data: labels,
      total: labels.length,
      message: 'Labels generated successfully'
    });
  } else if (format === 'csv') {
    // CSV format
    const csvContent = [
      'Item ID,SKU,Short ID,Name,Description,Category,Unit Price,RFID,QR Code URL,Barcode URL',
      ...labels.map(label => 
        `"${label.id}","${label.sku}","${label.shortId}","${label.name}","${label.description}","${label.category}",${label.unitPrice},"${label.hasRfid ? 'Yes' : 'No'}","${label.qrCode}","${label.barcode}"`
      )
    ].join('\n');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="bulk-labels.csv"');
    res.send(csvContent);
  } else {
    // ZIP format - return a structured JSON file that can be processed
    const zipData = {
      metadata: {
        generatedAt: new Date().toISOString(),
        totalItems: labels.length,
        format: 'zip',
        version: '1.0'
      },
      labels: labels.map(label => ({
        id: label.id,
        sku: label.sku,
        shortId: label.shortId,
        name: label.name,
        description: label.description,
        category: label.category,
        unitPrice: label.unitPrice,
        hasRfid: label.hasRfid,
        qrCodeData: label.sku,
        barcodeData: label.shortId,
        qrCodeUrl: label.qrCode,
        barcodeUrl: label.barcode,
        generatedAt: label.generatedAt
      }))
    };
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="bulk-labels-data.json"');
    res.json(zipData);
  }
});

// ==================== USER MANAGEMENT API ====================

// Get all users endpoint (superadmin only)
app.get('/api/users', authenticateToken, (req, res) => {
  const { role } = req.user;
  
  // Only superadmin can access all users
  if (role !== 'superadmin') {
    return res.status(403).json({ error: 'Access denied. Superadmin role required.' });
  }
  
  const { 
    page = 1, 
    limit = 10, 
    search = '', 
    role: roleFilter = '', 
    status = '',
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;
  
  let filteredUsers = [...users];
  
  // Apply search filter
  if (search) {
    const searchLower = search.toLowerCase();
    filteredUsers = filteredUsers.filter(user => 
      user.firstName.toLowerCase().includes(searchLower) ||
      user.lastName.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower)
    );
  }
  
  // Apply role filter
  if (roleFilter) {
    filteredUsers = filteredUsers.filter(user => user.role === roleFilter);
  }
  
  // Apply status filter
  if (status !== '') {
    const isActive = status === 'active';
    filteredUsers = filteredUsers.filter(user => user.isActive === isActive);
  }
  
  // Apply sorting
  filteredUsers.sort((a, b) => {
    let aValue = a[sortBy];
    let bValue = b[sortBy];
    
    if (sortBy === 'createdAt' || sortBy === 'lastLogin') {
      aValue = new Date(aValue);
      bValue = new Date(bValue);
    }
    
    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });
  
  // Apply pagination
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + parseInt(limit);
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);
  
  // Remove password from response
  const safeUsers = paginatedUsers.map(user => {
    const { password, ...safeUser } = user;
    return safeUser;
  });
  
  res.json({
    data: safeUsers,
    pagination: {
      currentPage: parseInt(page),
      totalPages: Math.ceil(filteredUsers.length / limit),
      totalItems: filteredUsers.length,
      itemsPerPage: parseInt(limit)
    },
    filters: {
      search,
      role: roleFilter,
      status,
      sortBy,
      sortOrder
    }
  });
});

// Get user roles endpoint (must be before /api/users/:id)
app.get('/api/users/roles', authenticateToken, (req, res) => {
  const { role } = req.user;
  
  // Only superadmin can access roles
  if (role !== 'superadmin') {
    return res.status(403).json({ error: 'Access denied. Superadmin role required.' });
  }
  
  const roles = [
    {
      value: 'superadmin',
      label: 'Super Admin',
      description: 'Full system access and user management',
      permissions: ['all']
    },
    {
      value: 'retail_manager',
      label: 'Retail Manager',
      description: 'Manage retail operations and staff',
      permissions: ['items', 'locations', 'sessions', 'reports']
    },
    {
      value: 'warehouse_manager',
      label: 'Warehouse Manager',
      description: 'Manage warehouse operations and inventory',
      permissions: ['items', 'warehouse', 'inventory', 'reports']
    },
    {
      value: 'staff',
      label: 'Staff',
      description: 'Basic operations and data entry',
      permissions: ['items', 'sessions']
    }
  ];
  
  res.json({
    data: roles
  });
});

// Get single user endpoint
app.get('/api/users/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { role, id: userId } = req.user;
  
  // Only superadmin can access any user, others can only access their own profile
  if (role !== 'superadmin' && userId !== id) {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  const user = users.find(u => u.id === id);
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  // Remove password from response
  const { password, ...safeUser } = user;
  
  res.json({
    data: safeUser
  });
});

// Create user endpoint (superadmin only)
app.post('/api/users', authenticateToken, (req, res) => {
  const { role } = req.user;
  
  // Only superadmin can create users
  if (role !== 'superadmin') {
    return res.status(403).json({ error: 'Access denied. Superadmin role required.' });
  }
  
  const { 
    email, 
    password, 
    firstName, 
    lastName, 
    role: userRole, 
    storeId, 
    warehouseId 
  } = req.body;
  
  // Validation
  if (!email || !password || !firstName || !lastName || !userRole) {
    return res.status(400).json({ error: 'Email, password, first name, last name, and role are required' });
  }
  
  // Check if email already exists
  const existingUser = users.find(u => u.email === email);
  if (existingUser) {
    return res.status(400).json({ error: 'User with this email already exists' });
  }
  
  // Validate role
  const validRoles = ['superadmin', 'retail_manager', 'warehouse_manager', 'staff'];
  if (!validRoles.includes(userRole)) {
    return res.status(400).json({ error: 'Invalid role. Valid roles: superadmin, retail_manager, warehouse_manager, staff' });
  }
  
  // Hash password
  const hashedPassword = bcrypt.hashSync(password, BCRYPT_ROUNDS);
  
  // Create new user
  const newUser = {
    id: (users.length + 1).toString(),
    email,
    password: hashedPassword,
    firstName,
    lastName,
    role: userRole,
    storeId: storeId || null,
    warehouseId: warehouseId || null,
    isActive: true,
    createdAt: new Date().toISOString(),
    lastLogin: null
  };
  
  users.push(newUser);
  
  // Remove password from response
  const { password: _, ...safeUser } = newUser;
  
  res.status(201).json({
    data: safeUser,
    message: 'User created successfully'
  });
});

// Update user endpoint
app.put('/api/users/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { role, id: userId } = req.user;
  
  // Only superadmin can update any user, others can only update their own profile
  if (role !== 'superadmin' && userId !== id) {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  const userIndex = users.findIndex(u => u.id === id);
  
  if (userIndex === -1) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  const { 
    email, 
    password, 
    firstName, 
    lastName, 
    role: userRole, 
    storeId, 
    warehouseId, 
    isActive 
  } = req.body;
  
  // Check if email already exists (excluding current user)
  if (email && email !== users[userIndex].email) {
    const existingUser = users.find(u => u.email === email && u.id !== id);
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }
  }
  
  // Only superadmin can change role and status
  if (role !== 'superadmin') {
    if (userRole !== undefined || isActive !== undefined) {
      return res.status(403).json({ error: 'Access denied. Cannot modify role or status.' });
    }
  }
  
  // Validate role if being changed
  if (userRole && role === 'superadmin') {
    const validRoles = ['superadmin', 'retail_manager', 'warehouse_manager', 'staff'];
    if (!validRoles.includes(userRole)) {
      return res.status(400).json({ error: 'Invalid role. Valid roles: superadmin, retail_manager, warehouse_manager, staff' });
    }
  }
  
  // Update user
  const updatedUser = {
    ...users[userIndex],
    email: email || users[userIndex].email,
    password: password ? bcrypt.hashSync(password, 10) : users[userIndex].password,
    firstName: firstName || users[userIndex].firstName,
    lastName: lastName || users[userIndex].lastName,
    role: userRole || users[userIndex].role,
    storeId: storeId !== undefined ? storeId : users[userIndex].storeId,
    warehouseId: warehouseId !== undefined ? warehouseId : users[userIndex].warehouseId,
    isActive: isActive !== undefined ? isActive : users[userIndex].isActive
  };
  
  users[userIndex] = updatedUser;
  
  // Remove password from response
  const { password: _, ...safeUser } = updatedUser;
  
  res.json({
    data: safeUser,
    message: 'User updated successfully'
  });
});

// Delete user endpoint (superadmin only)
app.delete('/api/users/:id', authenticateToken, (req, res) => {
  const { role, id: userId } = req.user;
  
  // Only superadmin can delete users
  if (role !== 'superadmin') {
    return res.status(403).json({ error: 'Access denied. Superadmin role required.' });
  }
  
  // Prevent self-deletion
  if (userId === req.params.id) {
    return res.status(400).json({ error: 'Cannot delete your own account' });
  }
  
  const userIndex = users.findIndex(u => u.id === req.params.id);
  
  if (userIndex === -1) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  // Soft delete
  users[userIndex].isActive = false;
  
  res.json({
    message: 'User deleted successfully'
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Error:', error);
  res.status(error.status || 500).json({
    error: error.message || 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Not Found', 
    message: `Route ${req.originalUrl} not found` 
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 StockTake API server running on port ${PORT}`);
  console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
  console.log(`📚 API Documentation: http://localhost:${PORT}/api/docs`);
  console.log(`\n🔑 Demo Credentials:`);
  console.log(`   Admin: admin@stocktake.com / password123`);
  console.log(`   Manager: manager.central@stocktake.com / password123`);
});

module.exports = app;