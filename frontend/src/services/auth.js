import api from './api';

export const authService = {
  async login(username, password) {
    const response = await api.post('/auth/login/', { username, password });
    const { access, refresh } = response.data;
    
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
    
    // Получаем информацию о пользователе
    const userResponse = await api.get('/auth/me/');
    localStorage.setItem('user', JSON.stringify(userResponse.data));
    
    return userResponse.data;
  },

  async register(userData) {
    const response = await api.post('/auth/register/', userData);
    return response.data;
  },

  logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
  },

  getCurrentUser() {
    const userStr = localStorage.getItem('user');
    if (!userStr || userStr === 'undefined' || userStr === 'null') {
      return null;
    }
    try {
      return JSON.parse(userStr);
    } catch (error) {
      console.error('Error parsing user data:', error);
      localStorage.removeItem('user');
      return null;
    }
  },

  isAuthenticated() {
    return !!localStorage.getItem('access_token');
  },

  getRole() {
    const user = this.getCurrentUser();
    return user?.role || null;
  },
};
