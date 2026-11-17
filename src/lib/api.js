import axios from 'axios';

export const API_URL = (import.meta.env.VITE_API_URL || 'https://league-of-coders-backend.onrender.com').replace(/\/$/, '');
const TOKEN_KEY = 'loc.token';

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

const http = axios.create({ baseURL: `${API_URL}/api`, timeout: 30000 });

http.interceptors.request.use((req) => {
  const token = tokenStore.get();
  if (token) req.headers.Authorization = `Bearer ${token}`;
  return req;
});

http.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const message =
      err.response?.data?.message ||
      (err.code === 'ECONNABORTED' ? 'The server took too long to respond' : 'Could not reach the server');
    const error = new Error(message);
    error.status = err.response?.status;
    if (error.status === 401) window.dispatchEvent(new Event('loc:unauthorized'));
    return Promise.reject(error);
  }
);

export const api = {
  auth: {
    login: (body) => http.post('/auth/login', body),
    register: (body) => http.post('/auth/register', body),
    google: (credential) => http.post('/auth/google', { credential }),
    me: () => http.get('/auth/me'),
  },
  users: {
    get: (id) => http.get(`/users/${id}`),
    updateMe: (body) => http.patch('/users/me', body),
    linkLeetCode: (username) => http.put('/users/me/leetcode', { username }),
    verifyLeetCode: () => http.post('/users/me/leetcode/verify'),
    unlinkLeetCode: () => http.delete('/users/me/leetcode'),
    solved: () => http.get('/users/me/solved'),
    setSolved: (slug, solved) => http.put(`/users/me/solved/${slug}`, { solved }),
    leaderboard: (limit = 50) => http.get('/users/leaderboard', { params: { limit } }),
    progress: () => http.get('/users/me/progress'),
  },
  friends: {
    list: () => http.get('/friends'),
    search: (q) => http.get('/friends/search', { params: { q } }),
    request: (userId) => http.post('/friends/requests', { userId }),
    accept: (id) => http.post(`/friends/requests/${id}/accept`),
    decline: (id) => http.post(`/friends/requests/${id}/decline`),
    remove: (userId) => http.delete(`/friends/${userId}`),
    activity: () => http.get('/friends/activity'),
    invite: (userId, code) => http.post('/friends/invite', { userId, code }),
    invites: () => http.get('/friends/invites'),
    dismissInvite: (id) => http.post(`/friends/invites/${id}/dismiss`),
  },
  problems: {
    list: (params) => http.get('/problems', { params }),
    topics: (pool) => http.get('/problems/topics', { params: { pool } }),
    daily: () => http.get('/problems/daily'),
    get: (slug) => http.get(`/problems/${slug}`),
  },
  matches: {
    create: (body) => http.post('/matches', body),
    get: (code) => http.get(`/matches/${code}`),
    open: () => http.get('/matches/open'),
    recent: (limit) => http.get('/matches/recent', { params: { limit } }),
    mine: () => http.get('/matches/mine'),
    stats: () => http.get('/matches/stats'),
    join: (code) => http.post(`/matches/${code}/join`),
    leave: (code) => http.post(`/matches/${code}/leave`),
    update: (code, body) => http.patch(`/matches/${code}`, body),
    setPrefs: (code, body) => http.patch(`/matches/${code}/me`, body),
    kick: (code, userId) => http.delete(`/matches/${code}/players/${userId}`),
    start: (code) => http.post(`/matches/${code}/start`),
    end: (code) => http.post(`/matches/${code}/end`),
    check: (code) => http.post(`/matches/${code}/check`),
    chat: (code, text) => http.post(`/matches/${code}/messages`, { text }),
    rematch: (code) => http.post(`/matches/${code}/rematch`),
  },
  posts: {
    list: (params) => http.get('/posts', { params }),
    create: (body) => http.post('/posts', body),
    remove: (id) => http.delete(`/posts/${id}`),
    like: (id) => http.post(`/posts/${id}/like`),
    comment: (id, body) => http.post(`/posts/${id}/comments`, { body }),
    removeComment: (id, commentId) => http.delete(`/posts/${id}/comments/${commentId}`),
  },
};
