# Environment Configuration Guide

This guide explains how to set up and use environment variables for the StockTake Project v2.

## 📁 Environment Files Structure

```
stocktake-project-v2/
├── .env.example                 # Root environment template
├── api/
│   ├── .env                    # API server environment
│   └── .env.example           # API server template
├── admin/
│   ├── .env.local             # Admin dashboard environment
│   └── .env.example           # Admin dashboard template
└── mobile/
    ├── .env                   # Mobile app environment
    └── .env.example           # Mobile app template
```

## 🚀 Quick Setup

### 1. Copy Environment Templates

```bash
# Copy templates to create actual environment files
cp .env.example .env
cp api/.env.example api/.env
cp admin/.env.example admin/.env.local
cp mobile/.env.example mobile/.env
```

### 2. Update Configuration Values

Edit each `.env` file with your specific configuration values.

## 🔧 Component-Specific Configuration

### API Server (`api/.env`)

```env
# Server Configuration
PORT=3005
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:19006,http://localhost:3006

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Security
BCRYPT_ROUNDS=10
```

### Admin Dashboard (`admin/.env.local`)

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3005
NEXT_PUBLIC_API_TIMEOUT=10000

# Application Configuration
NEXT_PUBLIC_APP_NAME=StockTake Admin
NEXT_PUBLIC_APP_VERSION=2.0.0
NEXT_PUBLIC_APP_ENVIRONMENT=development

# Authentication Configuration
NEXT_PUBLIC_JWT_STORAGE_KEY=auth-storage
NEXT_PUBLIC_SESSION_TIMEOUT=86400000

# Feature Flags
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_REPORTS=true
NEXT_PUBLIC_ENABLE_USER_MANAGEMENT=true
NEXT_PUBLIC_ENABLE_LABEL_GENERATION=true
```

### Mobile App (`mobile/.env`)

```env
# API Configuration
EXPO_PUBLIC_API_URL=http://localhost:3005
EXPO_PUBLIC_API_TIMEOUT=10000

# Application Configuration
EXPO_PUBLIC_APP_NAME=StockTake Mobile
EXPO_PUBLIC_APP_VERSION=2.0.0
EXPO_PUBLIC_APP_ENVIRONMENT=development

# Scanner Configuration
EXPO_PUBLIC_ENABLE_BARCODE_SCANNER=true
EXPO_PUBLIC_ENABLE_RFID_SCANNER=true
EXPO_PUBLIC_SCANNER_TIMEOUT=30000

# Offline Configuration
EXPO_PUBLIC_ENABLE_OFFLINE_MODE=true
EXPO_PUBLIC_OFFLINE_SYNC_INTERVAL=300000
EXPO_PUBLIC_MAX_OFFLINE_ITEMS=1000
```

## 🔒 Security Best Practices

### 1. Environment File Security

- **Never commit `.env` files** to version control
- Use `.env.example` files as templates
- Keep sensitive data in environment variables
- Use different secrets for different environments

### 2. JWT Secret Management

```env
# Development
JWT_SECRET=dev-secret-key-not-for-production

# Production (use a strong, random secret)
JWT_SECRET=your-super-secure-random-secret-key-here
```

### 3. CORS Configuration

```env
# Development
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:19006,http://localhost:3006

# Production
ALLOWED_ORIGINS=https://yourdomain.com,https://admin.yourdomain.com
```

## 🌍 Environment-Specific Configuration

### Development Environment

```env
NODE_ENV=development
DEBUG_MODE=true
LOG_LEVEL=debug
```

### Production Environment

```env
NODE_ENV=production
DEBUG_MODE=false
LOG_LEVEL=info
```

## 📱 Platform-Specific Variables

### Next.js (Admin Dashboard)

- Variables must be prefixed with `NEXT_PUBLIC_` to be available in the browser
- Use `.env.local` for local development
- Use `.env.production` for production builds

### Expo (Mobile App)

- Variables must be prefixed with `EXPO_PUBLIC_` to be available in the app
- Use `.env` for all environments
- Variables are bundled into the app at build time

### Node.js (API Server)

- All variables are available server-side
- Use `.env` for all environments
- Variables are loaded at runtime

## 🔄 Environment Variable Loading

### API Server

```javascript
// Load environment variables
require('dotenv').config();

// Use environment variables
const PORT = process.env.PORT || 3005;
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';
```

### Admin Dashboard

```javascript
// Environment variables are automatically loaded by Next.js
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3005';
```

### Mobile App

```javascript
// Environment variables are available at build time
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3005';
```

## 🧪 Testing Environment Configuration

### 1. API Server Test

```bash
cd api
npm start
curl http://localhost:3005/health
```

### 2. Admin Dashboard Test

```bash
cd admin
npm run dev
# Visit http://localhost:3006
```

### 3. Mobile App Test

```bash
cd mobile
npm start
# Scan QR code with Expo Go app
```

## 🚨 Troubleshooting

### Common Issues

1. **Environment variables not loading**
   - Check file names (`.env`, `.env.local`)
   - Verify variable prefixes (`NEXT_PUBLIC_`, `EXPO_PUBLIC_`)
   - Restart the application after changes

2. **CORS errors**
   - Update `ALLOWED_ORIGINS` in API `.env`
   - Include all client URLs

3. **JWT errors**
   - Ensure `JWT_SECRET` is set in API `.env`
   - Use the same secret across all components

4. **API connection errors**
   - Verify `API_URL` in client `.env` files
   - Check if API server is running

### Debug Commands

```bash
# Check environment variables
echo $NODE_ENV
echo $PORT

# Test API connection
curl http://localhost:3005/health

# Check Next.js environment
npm run dev -- --debug
```

## 📋 Environment Checklist

- [ ] All `.env` files created from templates
- [ ] JWT secrets configured and secure
- [ ] CORS origins updated for your domains
- [ ] API URLs pointing to correct servers
- [ ] Feature flags enabled/disabled as needed
- [ ] Security settings appropriate for environment
- [ ] All components tested with new configuration

## 🔄 Deployment Considerations

### Docker Deployment

```dockerfile
# Copy environment files
COPY .env .env
COPY api/.env api/.env
COPY admin/.env.local admin/.env.local
COPY mobile/.env mobile/.env
```

### Cloud Deployment

- Use cloud provider environment variable management
- Set sensitive variables through secure interfaces
- Use different configurations for different environments

---

**Note**: Always keep your `.env` files secure and never commit them to version control. Use `.env.example` files to share configuration templates with your team.
