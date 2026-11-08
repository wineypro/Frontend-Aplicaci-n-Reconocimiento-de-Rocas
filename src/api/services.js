import { Platform } from 'react-native';
import { apiRequest } from './apiClient';

const toQueryString = (params = {}) => {
  const entries = Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== '');
  if (entries.length === 0) return '';
  return '?' + entries.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&');
};

export const authApi = {
  login: (email, password) => apiRequest('/user/login', { method: 'POST', body: { email, password } }),
  register: (payload) => apiRequest('/user/registro', { method: 'POST', body: payload }),
  getProfile: () => apiRequest('/user/me'),
  updateProfile: (payload) => apiRequest('/user/me', { method: 'PATCH', body: payload }),
  createGuestSession: () => apiRequest('/guest/session', { method: 'POST' }),
  getGuestSession: (guestToken) =>
    apiRequest('/guest/session', {
      customHeaders: guestToken ? { 'X-Guest-Token': guestToken } : {}
    }),
  migrateGuest: (guestToken) =>
    apiRequest('/guest/migrate', {
      method: 'POST',
      customHeaders: { 'X-Guest-Token': guestToken }
    })
};

export const catalogApi = {
  listRocks: (params) => apiRequest(`/rock${toQueryString(params)}`),
  getRock: (id) => apiRequest(`/rock/${id}`),
  searchByText: (q) => apiRequest(`/rock/identificar${toQueryString({ q })}`),
  filterByHardness: (min, max) => apiRequest(`/rock/dureza${toQueryString({ min, max })}`),
  listTypes: () => apiRequest('/type?limit=100'),
  listCategories: () => apiRequest('/category?limit=100'),
  getRocksByType: (typeId) => apiRequest(`/type/${typeId}/rocks`),
  getRocksByCategory: (categoryId) => apiRequest(`/category/${categoryId}/rocks`)
};

export const recognitionApi = {
  recognizeManual: (payload) => apiRequest('/recognition', { method: 'POST', body: payload }),
  recognizeAutoImage: async (imageAsset) => {
    const formData = new FormData();
    const filename = imageAsset.fileName || `roca_${Date.now()}.jpg`;
    const mimeType = imageAsset.mimeType || 'image/jpeg';

    if (Platform.OS === 'web') {
      const res = await fetch(imageAsset.uri);
      const blob = await res.blob();
      formData.append('image', blob, filename);
    } else {
      formData.append('image', {
        uri: imageAsset.uri,
        name: filename,
        type: mimeType
      });
    }

    return apiRequest('/recognition/auto', {
      method: 'POST',
      body: formData,
      isMultipart: true
    });
  }
};

export const collectionApi = {
  getMyCollection: () => apiRequest('/collection/me'),
  getMyRockDetail: (rockId) => apiRequest(`/collection/me/${rockId}`),
  fuseRocks: (rockId1, rockId2) =>
    apiRequest('/collection/fusion', { method: 'POST', body: { rockId1: Number(rockId1), rockId2: Number(rockId2) } })
};

export const progressApi = {
  getStats: () => apiRequest('/progress/me'),
  getHistory: (params) => apiRequest(`/progress/me/history${toQueryString(params)}`),
  getMyAchievements: () => apiRequest('/achievement/me'),
  listAllAchievements: () => apiRequest('/achievement?limit=100')
};

export const feedbackApi = {
  create: (analysisId, isCorrect, comment) =>
    apiRequest(`/recognition/${analysisId}/feedback`, {
      method: 'POST',
      body: { isCorrect: Boolean(isCorrect), ...(comment ? { comment } : {}) }
    }),
  get: (analysisId) => apiRequest(`/recognition/${analysisId}/feedback`),
  update: (analysisId, payload) =>
    apiRequest(`/recognition/${analysisId}/feedback`, { method: 'PATCH', body: payload })
};

export const adminApi = {
  getStats: () => apiRequest('/admin/stats'),
  getRecognitions: (params) => apiRequest(`/admin/recognitions${toQueryString(params)}`),
  getFeedback: (params) => apiRequest(`/admin/feedback${toQueryString(params)}`),
  listUsers: (params) => apiRequest(`/user${toQueryString(params)}`),
  listRoles: () => apiRequest('/role?limit=100'),
  updateUser: (userId, payload) => apiRequest(`/admin/users/${userId}`, { method: 'PATCH', body: payload }),
  getUserCollection: (userId, params) => apiRequest(`/admin/users/${userId}/collection${toQueryString(params)}`),
  getUserAchievements: (userId, params) => apiRequest(`/admin/users/${userId}/achievements${toQueryString(params)}`),
  // CRUD Catálogo y Logros (Admin)
  createRock: (payload) => apiRequest('/rock', { method: 'POST', body: payload }),
  updateRock: (id, payload) => apiRequest(`/rock/${id}`, { method: 'PATCH', body: payload }),
  deleteRock: (id) => apiRequest(`/rock/${id}`, { method: 'DELETE' }),
  createType: (payload) => apiRequest('/type', { method: 'POST', body: payload }),
  updateType: (id, payload) => apiRequest(`/type/${id}`, { method: 'PATCH', body: payload }),
  deleteType: (id) => apiRequest(`/type/${id}`, { method: 'DELETE' }),
  createCategory: (payload) => apiRequest('/category', { method: 'POST', body: payload }),
  updateCategory: (id, payload) => apiRequest(`/category/${id}`, { method: 'PATCH', body: payload }),
  deleteCategory: (id) => apiRequest(`/category/${id}`, { method: 'DELETE' }),
  createAchievement: (payload) => apiRequest('/achievement', { method: 'POST', body: payload }),
  updateAchievement: (id, payload) => apiRequest(`/achievement/${id}`, { method: 'PATCH', body: payload }),
  deleteAchievement: (id) => apiRequest(`/achievement/${id}`, { method: 'DELETE' })
};