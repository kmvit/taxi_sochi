import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { authService } from '../services/auth';
import api from '../services/api';
import { 
  initializeNotifications, 
  cleanupNotifications 
} from '../services/notifications';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Проверяем авторизацию и валидность токена
    const checkAuth = async () => {
      const token = localStorage.getItem('access_token');
      const refreshToken = localStorage.getItem('refresh_token');
      
      console.log('[Auth] Checking authentication...', { 
        hasToken: !!token, 
        hasRefreshToken: !!refreshToken
      });
      
      // Если есть refresh token, но нет access token, пытаемся обновить
      if (!token && refreshToken) {
        try {
          console.log('[Auth] No access token, trying to refresh...');
          const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
          const response = await axios.post(`${API_URL}/auth/refresh/`, {
            refresh: refreshToken,
          });
          const { access, refresh: newRefresh } = response.data;
          localStorage.setItem('access_token', access);
          // Обновляем refresh token, если он был обновлен
          if (newRefresh) {
            localStorage.setItem('refresh_token', newRefresh);
          }
          console.log('[Auth] Token refreshed successfully');
        } catch (refreshError) {
          console.error('[Auth] Token refresh failed:', refreshError.message);
          authService.logout();
          setUser(null);
          setLoading(false);
          return;
        }
      }
      
      // Если есть токен (или мы его только что обновили), проверяем валидность
      const currentToken = localStorage.getItem('access_token');
      if (currentToken) {
        try {
          // Проверяем валидность токена через запрос к API
          // Interceptor в api.js автоматически обновит токен, если он истек
          console.log('[Auth] Validating token...');
          const userResponse = await api.get('/auth/me/');
          const userData = userResponse.data;
          
          console.log('[Auth] Token valid, user authenticated:', userData.username);
          
          // Обновляем данные пользователя
          localStorage.setItem('user', JSON.stringify(userData));
          setUser(userData);
          
          // Ждём немного для регистрации service worker, затем инициализируем уведомления
          setTimeout(() => {
            console.log('[Auth] Initializing notifications...');
            initializeNotifications().then((result) => {
              if (result.success) {
                console.log('[Auth] Notifications initialized successfully');
              } else {
                console.log('[Auth] Failed to initialize notifications:', result.message);
              }
            }).catch((error) => {
              console.error('[Auth] Error initializing notifications:', error);
            });
          }, 1000);
        } catch (error) {
          // Если токен невалидный и не удалось обновить (interceptor уже попытался),
          // очищаем данные
          console.error('[Auth] Token validation failed:', error.message);
          authService.logout();
          setUser(null);
        }
      } else {
        // Нет токенов вообще
        console.log('[Auth] No valid credentials found');
        if (refreshToken) {
          authService.logout();
        }
        setUser(null);
      }
      
      setLoading(false);
    };
    
    checkAuth();
  }, []);

  const login = async (username, password) => {
    const userData = await authService.login(username, password);
    setUser(userData);
    
    // Инициализируем уведомления после успешного логина (асинхронно, не блокируем)
    // Используем setTimeout чтобы не блокировать возврат из функции
    setTimeout(() => {
      initializeNotifications()
        .then((result) => {
          if (result.success) {
            console.log('Notifications initialized after login');
          } else {
            console.log('Failed to initialize notifications:', result.message);
          }
        })
        .catch((error) => {
          console.error('Error initializing notifications after login:', error);
        });
    }, 0);
    
    return userData;
  };

  const register = async (userData) => {
    const newUser = await authService.register(userData);
    return newUser;
  };

  const logout = async () => {
    // Очищаем уведомления перед выходом
    try {
      await cleanupNotifications();
      console.log('Notifications cleaned up');
    } catch (error) {
      console.error('Error cleaning up notifications:', error);
    }
    
    authService.logout();
    setUser(null);
  };

  const value = {
    user,
    login,
    register,
    logout,
    loading,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
