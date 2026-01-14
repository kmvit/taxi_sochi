import React, { createContext, useState, useContext, useEffect } from 'react';
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
      const currentUser = authService.getCurrentUser();
      
      console.log('[Auth] Checking authentication...', { 
        hasToken: !!token, 
        hasRefreshToken: !!refreshToken,
        hasUser: !!currentUser 
      });
      
      if (token && currentUser) {
        try {
          // Проверяем валидность токена через запрос к API
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
          // Если токен невалидный, очищаем данные
          console.error('[Auth] Token validation failed:', error.message);
          authService.logout();
          setUser(null);
        }
      } else {
        // Нет токена или пользователя
        console.log('[Auth] No valid credentials found, clearing data');
        if (token || refreshToken || currentUser) {
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
