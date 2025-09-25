# StockTake API Documentation

## Overview

The StockTake API provides a comprehensive REST API for managing stock take operations across retail stores and warehouses. The API supports offline-first mobile applications with real-time synchronization capabilities.

## Base URL

```
Production: https://api.stocktake.com
Development: http://localhost:3001
```

## Authentication

All API endpoints require authentication using JWT tokens. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Rate Limiting

- **Rate Limit**: 1000 requests per 15 minutes per IP
- **Headers**: Rate limit information is included in response headers
- **Exceeded**: Returns 429 status code with retry-after header

## Error Handling

All errors follow a consistent format:

```json
{
  "error": "Error type",
  "message": "Detailed error message",
  "code": "ERROR_CODE"
}
```

## Endpoints

### Authentication

#### POST /api/auth/login
Authenticate user and receive JWT token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "retail_staff",
    "storeId": "uuid",
    "warehouseId": "uuid"
  }
}
```

#### POST /api/auth/register
Register new user (Admin only).

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "password": "password123",
  "firstName": "Jane",
  "lastName": "Smith",
  "role": "retail_staff",
  "storeId": "uuid",
  "warehouseId": "uuid"
}
```

#### POST /api/auth/refresh
Refresh JWT token.

**Response:**
```json
{
  "token": "new-jwt-token"
}
```

#### POST /api/auth/logout
Logout user and invalidate token.

### Users

#### GET /api/users
Get all users (Admin only).

**Query Parameters:**
- `role`: Filter by user role
- `storeId`: Filter by store
- `warehouseId`: Filter by warehouse
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)

#### GET /api/users/:id
Get user by ID.

#### PUT /api/users/:id
Update user information.

#### DELETE /api/users/:id
Deactivate user account.

### Sessions

#### GET /api/sessions
Get stock take sessions.

**Query Parameters:**
- `status`: Filter by session status
- `type`: Filter by session type (retail/warehouse)
- `storeId`: Filter by store
- `warehouseId`: Filter by warehouse

#### POST /api/sessions
Create new stock take session.

**Request Body:**
```json
{
  "name": "Year-End Stock Take 2025",
  "type": "retail",
  "storeId": "uuid",
  "metadata": {
    "description": "Annual inventory count",
    "zones": ["electronics", "accessories"]
  }
}
```

#### GET /api/sessions/:id
Get session details.

#### PUT /api/sessions/:id
Update session.

#### POST /api/sessions/:id/pause
Pause active session.

#### POST /api/sessions/:id/resume
Resume paused session.

#### POST /api/sessions/:id/complete
Complete session.

### Items

#### GET /api/items
Get items for stock take.

**Query Parameters:**
- `storeId`: Filter by store
- `warehouseId`: Filter by warehouse
- `category`: Filter by category
- `hasRfid`: Filter by RFID capability
- `search`: Search by name or SKU

#### GET /api/items/:id
Get item details.

#### GET /api/items/sku/:sku
Get item by SKU.

#### POST /api/items
Create new item (Admin only).

#### PUT /api/items/:id
Update item information.

### Counts

#### GET /api/counts
Get counts for session.

**Query Parameters:**
- `sessionId`: Filter by session
- `itemId`: Filter by item
- `userId`: Filter by user
- `round`: Filter by round number

#### POST /api/counts
Create new count.

**Request Body:**
```json
{
  "sessionId": "uuid",
  "itemId": "uuid",
  "roundNumber": 1,
  "countValue": 5,
  "scanMethod": "rfid",
  "remarks": "Found in electronics section",
  "photoUrl": "https://example.com/photo.jpg"
}
```

#### PUT /api/counts/:id
Update count.

#### DELETE /api/counts/:id
Delete count.

### Approvals

#### GET /api/approvals
Get pending approvals.

#### POST /api/approvals
Create approval record.

#### PUT /api/approvals/:id/approve
Approve counts.

**Request Body:**
```json
{
  "approvedCount": 5,
  "approvalNotes": "Counts match, approved"
}
```

#### PUT /api/approvals/:id/reject
Reject counts.

### Labels

#### GET /api/labels/item/:sku
Generate label for item.

**Query Parameters:**
- `format`: Label format (png, svg)

#### POST /api/labels/bulk
Generate labels for multiple items.

**Request Body:**
```json
{
  "itemIds": ["uuid1", "uuid2"],
  "format": "zip"
}
```

#### GET /api/labels/preview/:sku
Preview label (returns data URL).

### Sync

#### GET /api/sync/status
Get sync status for session.

#### POST /api/sync/status
Update sync status.

#### POST /api/sync/trigger
Trigger sync to external systems.

### Audit

#### GET /api/audit/logs
Get audit logs.

**Query Parameters:**
- `userId`: Filter by user
- `sessionId`: Filter by session
- `action`: Filter by action type
- `startDate`: Filter by start date
- `endDate`: Filter by end date

## Data Models

### User
```json
{
  "id": "uuid",
  "email": "string",
  "firstName": "string",
  "lastName": "string",
  "role": "retail_staff | retail_manager | warehouse_staff | retail_backend | tech_admin",
  "storeId": "uuid",
  "warehouseId": "uuid",
  "isActive": "boolean",
  "createdAt": "datetime",
  "updatedAt": "datetime"
}
```

### Session
```json
{
  "id": "uuid",
  "name": "string",
  "type": "retail | warehouse",
  "status": "active | paused | completed | cancelled",
  "storeId": "uuid",
  "warehouseId": "uuid",
  "createdBy": "uuid",
  "startedAt": "datetime",
  "pausedAt": "datetime",
  "completedAt": "datetime",
  "metadata": "object",
  "createdAt": "datetime",
  "updatedAt": "datetime"
}
```

### Item
```json
{
  "id": "uuid",
  "sku": "string",
  "shortId": "string",
  "name": "string",
  "description": "string",
  "hasRfid": "boolean",
  "category": "string",
  "unitPrice": "number",
  "storeId": "uuid",
  "warehouseId": "uuid",
  "isActive": "boolean",
  "createdAt": "datetime",
  "updatedAt": "datetime"
}
```

### Count
```json
{
  "id": "uuid",
  "sessionId": "uuid",
  "itemId": "uuid",
  "userId": "uuid",
  "deviceId": "string",
  "roundNumber": "1 | 2 | 3",
  "countValue": "number",
  "scanMethod": "rfid | barcode | qr | manual",
  "remarks": "string",
  "photoUrl": "string",
  "isConfirmed": "boolean",
  "countedAt": "datetime",
  "createdAt": "datetime",
  "updatedAt": "datetime"
}
```

## Webhooks

### Stock Take Completion
Triggered when a stock take session is completed and ready for approval.

**Endpoint:** `POST /webhooks/stocktake-completed`

**Payload:**
```json
{
  "sessionId": "uuid",
  "sessionName": "string",
  "type": "retail | warehouse",
  "completedAt": "datetime",
  "totalItems": "number",
  "managers": ["email1", "email2"]
}
```

### Approval Required
Triggered when counts require manager approval.

**Endpoint:** `POST /webhooks/approval-required`

**Payload:**
```json
{
  "sessionId": "uuid",
  "sessionName": "string",
  "pendingApprovals": "number",
  "managers": ["email1", "email2"]
}
```

### Sync Completed
Triggered when data is successfully synced to external systems.

**Endpoint:** `POST /webhooks/sync-completed`

**Payload:**
```json
{
  "sessionId": "uuid",
  "sessionName": "string",
  "integrationType": "netsuite | mps",
  "syncedAt": "datetime",
  "processedItems": "number"
}
```

## SDK Examples

### JavaScript/Node.js
```javascript
const axios = require('axios');

const api = axios.create({
  baseURL: 'http://localhost:3001',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

// Login
const login = async (email, password) => {
  const response = await api.post('/api/auth/login', { email, password });
  return response.data;
};

// Create count
const createCount = async (countData) => {
  const response = await api.post('/api/counts', countData);
  return response.data;
};

// Get items
const getItems = async (params) => {
  const response = await api.get('/api/items', { params });
  return response.data;
};
```

### Python
```python
import requests

class StockTakeAPI:
    def __init__(self, base_url, token):
        self.base_url = base_url
        self.headers = {'Authorization': f'Bearer {token}'}
    
    def login(self, email, password):
        response = requests.post(
            f'{self.base_url}/api/auth/login',
            json={'email': email, 'password': password}
        )
        return response.json()
    
    def create_count(self, count_data):
        response = requests.post(
            f'{self.base_url}/api/counts',
            json=count_data,
            headers=self.headers
        )
        return response.json()
```

## Testing

### Postman Collection
Import the provided Postman collection for easy API testing:
- Environment variables for different environments
- Pre-configured requests with examples
- Automated tests for common scenarios

### cURL Examples
```bash
# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@stocktake.com","password":"password123"}'

# Get items
curl -X GET http://localhost:3001/api/items \
  -H "Authorization: Bearer <token>"

# Create count
curl -X POST http://localhost:3001/api/counts \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"uuid","itemId":"uuid","roundNumber":1,"countValue":5}'
```

## Support

For API support and questions:
- **Email**: api-support@stocktake.com
- **Documentation**: https://docs.stocktake.com
- **Status Page**: https://status.stocktake.com
