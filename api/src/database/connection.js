const express = require('express');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/stocktake',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Test database connection
const testConnection = async () => {
  try {
    const client = await pool.connect();
    console.log('✅ Database connected successfully');
    client.release();
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.log('💡 Make sure PostgreSQL is running and the database exists');
  }
};

// Initialize database
const initializeDatabase = async () => {
  try {
    // Read and execute schema
    const fs = require('fs');
    const path = require('path');
    
    const schemaPath = path.join(__dirname, 'database', 'schema.sql');
    const seedPath = path.join(__dirname, 'database', 'seed.sql');
    
    if (fs.existsSync(schemaPath)) {
      const schema = fs.readFileSync(schemaPath, 'utf8');
      await pool.query(schema);
      console.log('✅ Database schema created');
    }
    
    if (fs.existsSync(seedPath)) {
      const seed = fs.readFileSync(seedPath, 'utf8');
      await pool.query(seed);
      console.log('✅ Sample data inserted');
    }
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
  }
};

module.exports = {
  pool,
  testConnection,
  initializeDatabase
};

