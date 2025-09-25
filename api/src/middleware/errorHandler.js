const errorHandler = (error, req, res, next) => {
  console.error('Error:', error);

  // Database errors
  if (error.code) {
    switch (error.code) {
      case '23505': // Unique violation
        return res.status(409).json({ 
          error: 'Duplicate entry', 
          message: 'A record with this information already exists' 
        });
      case '23503': // Foreign key violation
        return res.status(400).json({ 
          error: 'Reference error', 
          message: 'Referenced record does not exist' 
        });
      case '23502': // Not null violation
        return res.status(400).json({ 
          error: 'Missing required field', 
          message: 'A required field is missing' 
        });
      default:
        return res.status(500).json({ 
          error: 'Database error', 
          message: 'An unexpected database error occurred' 
        });
    }
  }

  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({ error: 'Invalid token' });
  }
  if (error.name === 'TokenExpiredError') {
    return res.status(401).json({ error: 'Token expired' });
  }

  // Validation errors
  if (error.isJoi) {
    return res.status(400).json({ 
      error: 'Validation error', 
      message: error.details[0].message 
    });
  }

  // Multer errors (file upload)
  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ 
      error: 'File too large', 
      message: 'File size exceeds the maximum allowed limit' 
    });
  }

  // Default error
  res.status(error.status || 500).json({
    error: error.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
};

module.exports = { errorHandler };
