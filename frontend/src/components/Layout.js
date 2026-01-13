import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Layout.css';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getDashboardLink = () => {
    if (!user) return '/';
    switch (user.role) {
      case 'admin':
        return '/admin';
      case 'driver':
        return '/driver/profile';
      case 'customer':
        return '/customer';
      default:
        return '/';
    }
  };

  const isActive = (path) => {
    // Специальная обработка для главной страницы водителя
    if (path === '/driver') {
      return location.pathname === '/driver' || location.pathname === '/driver/profile';
    }
    // Для остальных путей - стандартная проверка
    if (location.pathname === path) {
      return true;
    }
    // Проверяем, начинается ли путь с path + '/', но не для главной страницы
    return location.pathname.startsWith(path + '/') && path !== '/driver';
  };

  const getNavItems = () => {
    if (!user) return [];

    const getProfilePath = () => {
      switch (user.role) {
        case 'driver':
          return '/driver/profile';
        case 'customer':
          return '/customer/profile';
        case 'admin':
          return '/admin/profile';
        default:
          return '/profile';
      }
    };

    const profileItem = { path: getProfilePath(), label: 'Профиль', icon: '👤', mobileLabel: 'Профиль' };

    switch (user.role) {
      case 'driver':
        return [
          { path: '/driver/available', label: 'Поиск заказов', icon: '📋', mobileLabel: 'Поиск' },
          { path: '/driver/my-orders', label: 'Мои поездки', icon: '🚗', mobileLabel: 'Поездки' },
          { path: '/driver/my-cars', label: 'Мои авто', icon: '🚙', mobileLabel: 'Авто' },
          { path: '/driver', label: 'Профиль', icon: '👤', mobileLabel: 'Профиль' },
        ];
      case 'customer':
        return [
          { path: '/customer', label: 'Главная', icon: '🏠', mobileLabel: 'Главная' },
          { path: '/customer/create-order', label: 'Создать заказ', icon: '➕', mobileLabel: 'Создать' },
          { path: '/customer/orders', label: 'Мои заказы', icon: '📋', mobileLabel: 'Заказы' },
          profileItem,
        ];
      case 'admin':
        return [
          { path: '/admin', label: 'Главная', icon: '🏠', mobileLabel: 'Главная' },
          { path: '/admin/orders', label: 'Заказы', icon: '📋', mobileLabel: 'Заказы' },
          { path: '/admin/drivers', label: 'Водители', icon: '👥', mobileLabel: 'Водители' },
          { path: '/admin/cars', label: 'Автомобили', icon: '🚙', mobileLabel: 'Авто' },
          { path: '/admin/pricing', label: 'Прайс-лист', icon: '💰', mobileLabel: 'Прайс' },
          profileItem,
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems();

  return (
    <div className="layout">
      <header className="header">
        <div className="container">
          <div className="header-content">
            <Link to={getDashboardLink()} className="logo">
              <h1>Taxi Sochi</h1>
            </Link>
            <nav className="nav nav-desktop">
              {user && (
                <>
                  <div className="nav-links">
                    {navItems.map((item) => (
                      <Link
                        key={item.path}
                        to={item.path}
                        className={`nav-link ${isActive(item.path) ? 'active' : ''}`}
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                  <div className="nav-user">
                    <span className="user-info">
                      {user.username} ({user.role === 'admin' ? 'Админ' : user.role === 'driver' ? 'Водитель' : 'Заказчик'})
                    </span>
                    <button onClick={handleLogout} className="btn btn-logout">
                      Выход
                    </button>
                  </div>
                </>
              )}
            </nav>
          </div>
        </div>
      </header>
      <main className="main">
        <div className="container">{children}</div>
      </main>
      {user && navItems.length > 0 && (
        <nav className="nav-mobile">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-mobile-item ${isActive(item.path) ? 'active' : ''}`}
            >
              <span className="nav-mobile-icon">{item.icon}</span>
              <span className="nav-mobile-label">{item.mobileLabel}</span>
            </Link>
          ))}
        </nav>
      )}
      <footer className="footer footer-desktop">
        <div className="container">
          <p>&copy; 2024 Taxi Sochi. Все права защищены.</p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
