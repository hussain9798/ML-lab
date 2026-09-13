import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_URL
  || (import.meta.env.PROD ? 'https://ml-lab-tlh7.onrender.com/api' : '/api');

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to catch unauthorized responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Don't auto-redirect if checking auth or on login page
      const currentPath = window.location.pathname;
      if (!currentPath.includes('/login') && !currentPath.includes('/register')) {
        // Optional: can clear storage on expired session
      }
    }
    return Promise.reject(error);
  }
);

// Auth Endpoints
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  verifyOtp: (data) => api.post('/auth/verify-otp', data),
  resendOtp: (data) => api.post('/auth/resend-otp', data),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (data) => api.post('/auth/reset-password', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  requestEmailChange: (email) => api.post('/auth/profile/email-request', { email }),
  confirmEmailChange: (data) => api.post('/auth/profile/email-confirm', data),
};

// Algorithm Catalog Endpoints
export const algorithmsAPI = {
  getAll: (params) => api.get('/algorithms', { params }),
  getBySlug: (slug) => api.get(`/algorithms/${slug}`),
};

// Documentation Endpoints
export const documentationAPI = {
  getAll: () => api.get('/documentation'),
  getBySlug: (slug) => api.get(`/documentation/${slug}`),
};

// Code Execution & Saved Code Endpoints
export const codeAPI = {
  execute: (code, algorithm_slug) => api.post('/code/execute', { code, algorithm_slug }),
  save: (data) => api.post('/code/save', data),
  getSaved: (params) => api.get('/code/saved', { params }),
  deleteSaved: (id) => api.delete(`/code/saved/${id}`),
};

// Test & Comparison Endpoints
export const testsAPI = {
  runComparison: (data) => api.post('/tests/run', data),
  getTestConfig: (slug) => api.get(`/tests/algorithm/${slug}`),
};

// Experiments Endpoints
export const experimentsAPI = {
  create: (data) => api.post('/experiments', data),
  getAll: (params) => api.get('/experiments', { params }),
  getById: (id) => api.get(`/experiments/${id}`),
  delete: (id) => api.delete(`/experiments/${id}`),
};

// Datasets Endpoints
export const datasetsAPI = {
  getAll: () => api.get('/datasets'),
  getPreview: (datasetId) => api.get(`/datasets/${datasetId}/preview`),
  upload: (data) => api.post('/datasets/upload', data),
};

// Progress Endpoints
export const progressAPI = {
  getProgress: () => api.get('/progress'),
  updateMilestone: (data) => api.post('/progress/milestone', data),
};

// Admin Endpoints
export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  getAlgorithms: () => api.get('/admin/algorithms'),
  createAlgorithm: (data) => api.post('/admin/algorithms', data),
  updateAlgorithm: (id, data) => api.put(`/admin/algorithms/${id}`, data),
  deleteAlgorithm: (id) => api.delete(`/admin/algorithms/${id}`),
  getDocs: () => api.get('/admin/documentation'),
  createDoc: (data) => api.post('/admin/documentation', data),
  updateDoc: (id, data) => api.put(`/admin/documentation/${id}`, data),
  uploadDocPdf: (id, file) => {
    const formData = new FormData();
    formData.append('pdf', file);
    return api.post(`/admin/documentation/${id}/pdf`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getUsers: () => api.get('/admin/users'),
  updateUserRole: (id, role) => api.put(`/admin/users/${id}/role`, { role }),
};

export default api;
