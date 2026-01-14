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
      const currentUser = authService.getCurrentUser();
      
      if (token && currentUser) {
        try {
          // Проверяем валидность токена через запрос к API
          const userResponse = await api.get('/auth/me/');
          const userData = userResponse.data;
          
          // Обновляем данные пользователя
          localStorage.setItem('user', JSON.stringify(userData));
          setUser(userData);
          
          // Инициализируем уведомления для авторизованного пользователя
          initializeNotifications().then((result) => {
            if (result.success) {
              console.log('Notifications initialized successfully');
            } else {
              console.log('Failed to initialize notifications:', result.message);
            }
          });
        } catch (error) {
          // Если токен невалидный, очищаем данные
          console.error('Token validation failed:', error);
          authService.logout();
          setUser(null);
        }
      } else {
        // Нет токена или пользователя - очищаем на всякий случай
        authService.logout();
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
