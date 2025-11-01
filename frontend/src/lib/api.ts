import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export const authApi = {
  signup: (data: { name: string; email: string; password: string }) =>
    api.post('/auth/signup', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  me: () => api.get('/me'),
};

export const projectsApi = {
  list: () => api.get('/projects'),
  get: (id: number) => api.get(`/projects/${id}`),
  create: (data: { name: string; key: string; description?: string }) =>
    api.post('/projects', data),
};

export const issuesApi = {
  list: (projectId: number, params?: Record<string, any>) =>
    api.get(`/projects/${projectId}/issues`, { params }),
  get: (id: number) => api.get(`/issues/${id}`),
  create: (
    projectId: number,
    data: { title: string; description?: string; priority: string; assignee_id?: number; expected_completion_date?: string }
  ) => api.post(`/projects/${projectId}/issues`, data),
  update: (
    id: number,
    data: { status: string; priority: string; assignee_id: number | null; expected_completion_date?: string }
  ) => api.patch(`/issues/${id}`, data),
  remove: (id: number) => api.delete(`/issues/${id}`),
  delete: (id: number) => api.delete(`/issues/${id}`),
};

export const commentsApi = {
  list: (issueId: number) => api.get(`/issues/${issueId}/comments`),
  create: (issueId: number, data: { body: string }) =>
    api.post(`/issues/${issueId}/comments`, data),
};

export {};
// placeholder
