const axios = require('axios');

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3005';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = global.authToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      global.authToken = null;
      // You might want to redirect to login here
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: (email, password) => api.post('/api/auth/login', { email, password }),
  logout: (token) => api.post('/api/auth/logout', {}, { headers: { Authorization: `Bearer ${token}` } }),
  refreshToken: (token) => api.post('/api/auth/refresh', {}, { headers: { Authorization: `Bearer ${token}` } }),
};

// Items API
export const itemsApi = {
  getItems: (params) => api.get('/api/items', { params }),
  getItemById: (id) => api.get(`/api/items/${id}`),
  getItemBySku: (sku) => api.get(`/api/items/sku/${sku}`),
};

// Sessions API
export const sessionsApi = {
  getSessions: (params) => api.get('/api/sessions', { params }),
  getSession: (id) => api.get(`/api/sessions/${id}`),
  createSession: (data) => api.post('/api/sessions', data),
  updateSession: (id, data) => api.put(`/api/sessions/${id}`, data),
  pauseSession: (id) => api.post(`/api/sessions/${id}/pause`),
  resumeSession: (id) => api.post(`/api/sessions/${id}/resume`),
  completeSession: (id) => api.post(`/api/sessions/${id}/complete`),
};

// Counts API
export const countsApi = {
  getCounts: (params) => api.get('/api/counts', { params }),
  createCount: (data) => api.post('/api/counts', data),
  updateCount: (id, data) => api.put(`/api/counts/${id}`, data),
  deleteCount: (id) => api.delete(`/api/counts/${id}`),
};

// Approvals API
export const approvalsApi = {
  getApprovals: (params) => api.get('/api/approvals', { params }),
  createApproval: (data) => api.post('/api/approvals', data),
  approveCounts: (id, data) => api.put(`/api/approvals/${id}/approve`, data),
  rejectCounts: (id, data) => api.put(`/api/approvals/${id}/reject`, data),
};

// Labels API
export const labelsApi = {
  generateLabel: (sku, format = 'png') => api.get(`/api/labels/item/${sku}`, { params: { format } }),
  generateBulkLabels: (itemIds, format = 'zip') => api.post('/api/labels/bulk', { itemIds, format }),
  previewLabel: (sku) => api.get(`/api/labels/preview/${sku}`),
};

// Sync API
export const syncApi = {
  getSyncStatus: (sessionId) => api.get('/api/sync/status', { params: { sessionId } }),
  updateSyncStatus: (data) => api.post('/api/sync/status', data),
  triggerSync: (sessionId) => api.post('/api/sync/trigger', { sessionId }),
};

// Audit API
export const auditApi = {
  getAuditLogs: (params) => api.get('/api/audit/logs', { params }),
};

export default api;

