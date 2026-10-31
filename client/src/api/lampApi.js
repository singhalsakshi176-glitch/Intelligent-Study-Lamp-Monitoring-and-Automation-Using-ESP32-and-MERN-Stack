import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 8000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const lampApi = {
  // Check lamp ON/OFF status
  getStatus: async (deviceId) => {
    const response = await api.get(`/lamp/status/${deviceId}`);
    return response.data;
  },

  // Turn lamp ON (starts new session or returns existing)
  turnOn: async (deviceId) => {
    const response = await api.post('/lamp/on', { deviceId });
    return response.data;
  },

  // Turn lamp OFF (closes active session and computes duration)
  turnOff: async (deviceId) => {
    const response = await api.post('/lamp/off', { deviceId });
    return response.data;
  },

  // Today study stats
  getTodayStats: async (deviceId) => {
    const response = await api.get(`/stats/today?deviceId=${encodeURIComponent(deviceId)}`);
    return response.data;
  },

  // Today vs yesterday comparison
  getCompareStats: async (deviceId) => {
    const response = await api.get(`/stats/compare?deviceId=${encodeURIComponent(deviceId)}`);
    return response.data;
  },

  // 7-day trend array
  getLast7Days: async (deviceId) => {
    const response = await api.get(`/stats/last7days?deviceId=${encodeURIComponent(deviceId)}`);
    return response.data;
  },

  // Recent study sessions
  getRecentSessions: async (deviceId, limit = 10) => {
    const response = await api.get(`/sessions?deviceId=${encodeURIComponent(deviceId)}&limit=${limit}`);
    return response.data;
  },
};

export default api;
