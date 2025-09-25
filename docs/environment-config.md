# Environment Configuration

## API Server (.env)
```bash
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/stocktake

# JWT
JWT_SECRET=your-super-secret-jwt-key-here

# Server
PORT=3005
NODE_ENV=development

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:19006

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads

# External Integrations
NETSUITE_ACCOUNT=your-netsuite-account
NETSUITE_SCRIPT_ID=your-script-id
NETSUITE_DEPLOY_ID=your-deploy-id
MPS_API_URL=https://your-mps-api.com
MPS_API_TOKEN=your-mps-token

# Email (for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Slack (for notifications)
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/your/webhook/url
```

## Mobile App (.env)
```bash
# API Configuration
EXPO_PUBLIC_API_URL=http://localhost:3005
EXPO_PUBLIC_API_TIMEOUT=30000

# App Configuration
EXPO_PUBLIC_APP_NAME=StockTake
EXPO_PUBLIC_APP_VERSION=1.0.0

# Offline Configuration
EXPO_PUBLIC_OFFLINE_SYNC_INTERVAL=300000
EXPO_PUBLIC_MAX_OFFLINE_RECORDS=10000

# Camera Configuration
EXPO_PUBLIC_CAMERA_QUALITY=0.8
EXPO_PUBLIC_MAX_PHOTO_SIZE=5242880

# Localization
EXPO_PUBLIC_DEFAULT_LANGUAGE=en
EXPO_PUBLIC_SUPPORTED_LANGUAGES=en,zh-TW
```

## Admin Dashboard (.env.local)
```bash
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3005
NEXT_PUBLIC_API_TIMEOUT=30000

# Admin Dashboard runs on port 3006
# Start with: npm run dev (configured to run on port 3006)

# App Configuration
NEXT_PUBLIC_APP_NAME=StockTake Admin
NEXT_PUBLIC_APP_VERSION=1.0.0

# Features
NEXT_PUBLIC_ENABLE_EXPORT=true
NEXT_PUBLIC_ENABLE_REAL_TIME=true
NEXT_PUBLIC_ENABLE_NOTIFICATIONS=true

# Analytics (optional)
NEXT_PUBLIC_GA_TRACKING_ID=your-ga-tracking-id
```

## Production Environment Variables

### API Server (Production)
```bash
# Database
DATABASE_URL=postgresql://prod_user:secure_password@prod-db-host:5432/stocktake_prod

# JWT
JWT_SECRET=production-super-secret-jwt-key-with-high-entropy

# Server
PORT=3005
NODE_ENV=production

# CORS
ALLOWED_ORIGINS=https://admin.stocktake.com,https://app.stocktake.com

# SSL
SSL_CERT_PATH=/path/to/ssl/cert.pem
SSL_KEY_PATH=/path/to/ssl/private.key

# Redis (for session storage)
REDIS_URL=redis://redis-host:6379

# Monitoring
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id

# External Integrations
NETSUITE_ACCOUNT=production-netsuite-account
NETSUITE_SCRIPT_ID=production-script-id
NETSUITE_DEPLOY_ID=production-deploy-id
MPS_API_URL=https://production-mps-api.com
MPS_API_TOKEN=production-mps-token

# Email
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key

# Slack
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/production/webhook/url
```

### Mobile App (Production)
```bash
# API Configuration
EXPO_PUBLIC_API_URL=https://api.stocktake.com
EXPO_PUBLIC_API_TIMEOUT=30000

# App Configuration
EXPO_PUBLIC_APP_NAME=StockTake
EXPO_PUBLIC_APP_VERSION=1.0.0

# Offline Configuration
EXPO_PUBLIC_OFFLINE_SYNC_INTERVAL=300000
EXPO_PUBLIC_MAX_OFFLINE_RECORDS=10000

# Camera Configuration
EXPO_PUBLIC_CAMERA_QUALITY=0.8
EXPO_PUBLIC_MAX_PHOTO_SIZE=5242880

# Localization
EXPO_PUBLIC_DEFAULT_LANGUAGE=en
EXPO_PUBLIC_SUPPORTED_LANGUAGES=en,zh-TW

# Analytics
EXPO_PUBLIC_ANALYTICS_ENABLED=true
EXPO_PUBLIC_CRASHLYTICS_ENABLED=true
```

### Admin Dashboard (Production)
```bash
# API Configuration
NEXT_PUBLIC_API_URL=https://api.stocktake.com
NEXT_PUBLIC_API_TIMEOUT=30000

# App Configuration
NEXT_PUBLIC_APP_NAME=StockTake Admin
NEXT_PUBLIC_APP_VERSION=1.0.0

# Features
NEXT_PUBLIC_ENABLE_EXPORT=true
NEXT_PUBLIC_ENABLE_REAL_TIME=true
NEXT_PUBLIC_ENABLE_NOTIFICATIONS=true

# Analytics
NEXT_PUBLIC_GA_TRACKING_ID=GA-XXXXXXXXX-X
```

## Docker Configuration

### docker-compose.yml
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: stocktake
      POSTGRES_USER: stocktake_user
      POSTGRES_PASSWORD: secure_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  api:
    build: ./api
    environment:
      DATABASE_URL: postgresql://stocktake_user:secure_password@postgres:5432/stocktake
      REDIS_URL: redis://redis:6379
      JWT_SECRET: your-jwt-secret
      NODE_ENV: production
    ports:
      - "3005:3005"
    depends_on:
      - postgres
      - redis

  admin:
    build: ./admin
    environment:
      NEXT_PUBLIC_API_URL: http://api:3005
    ports:
      - "3000:3000"
    depends_on:
      - api

volumes:
  postgres_data:
```

## Security Considerations

### Environment Variable Security
- Never commit `.env` files to version control
- Use different secrets for development, staging, and production
- Rotate JWT secrets regularly
- Use strong, unique passwords for all services
- Enable SSL/TLS in production
- Use environment-specific API keys

### Database Security
- Use connection pooling
- Enable SSL connections
- Regular security updates
- Backup encryption
- Access logging

### API Security
- Rate limiting
- Input validation
- SQL injection prevention
- XSS protection
- CORS configuration
- Authentication token expiration

## Deployment Checklist

### Pre-Deployment
- [ ] All environment variables configured
- [ ] Database migrations run
- [ ] SSL certificates installed
- [ ] Monitoring configured
- [ ] Backup strategy implemented

### Post-Deployment
- [ ] Health checks passing
- [ ] API endpoints responding
- [ ] Database connections working
- [ ] External integrations tested
- [ ] Monitoring alerts configured
