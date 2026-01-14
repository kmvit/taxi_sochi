import React, { createContext, useState, useContext, useEffect } from 'react';
import { authService } from '../services/auth';
import { 
  initializeNotifications, 
  cleanupNotifications 
} from '../services/notifications';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Проверяем, есть ли сохраненный пользователь
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      
      // Инициализируем уведомления для авторизованного пользователя
      // Делаем это асинхронно, чтобы не блокировать загрузку
      initializeNotifications().then((result) => {
        if (result.success) {
          console.log('Notifications initialized successfully');
        } else {
          console.log('Failed to initialize notifications:', result.message);
        }
      });
    }
    setLoading(false);
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
    isAuthenticated: authService.isAuthenticated(),
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
