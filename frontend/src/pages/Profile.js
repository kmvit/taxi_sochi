import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationSettings from '../components/NotificationSettings';

const Profile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) {
    return <div className="loading">Загрузка...</div>;
  }

  const getRoleLabel = (role) => {
    switch (role) {
      case 'admin':
        return 'Администратор';
      case 'driver':
        return 'Водитель';
      case 'customer':
        return 'Заказчик';
      default:
        return role;
    }
  };

  return (
    <div>
      <h1 className="page-title" style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>
        Профиль
      </h1>

      <div className="card" style={{ padding: '1rem', marginBottom: '1rem' }}>
        <h2 style={{ fontSize: '1.1rem', marginBottom: '0.75rem' }}>Личная информация</h2>
        <div className="profile-info">
          <div className="profile-field">
            <span className="profile-label">Имя пользователя:</span>
            <span className="profile-value">{user.username}</span>
          </div>
          <div className="profile-field">
            <span className="profile-label">Роль:</span>
            <span className="profile-value">{getRoleLabel(user.role)}</span>
          </div>
          {user.email && (
            <div className="profile-field">
              <span className="profile-label">Email:</span>
              <span className="profile-value">{user.email}</span>
            </div>
          )}
          {user.first_name && (
            <div className="profile-field">
              <span className="profile-label">Имя:</span>
              <span className="profile-value">{user.first_name}</span>
            </div>
          )}
          {user.last_name && (
            <div className="profile-field">
              <span className="profile-label">Фамилия:</span>
              <span className="profile-value">{user.last_name}</span>
            </div>
          )}
        </div>
      </div>

      {/* Настройки уведомлений */}
      <div className="card" style={{ padding: '1rem', marginBottom: '1rem' }}>
        <NotificationSettings />
      </div>

      {/* Кнопка выхода */}
      <div className="card" style={{ padding: '1rem' }}>
        <button 
          onClick={handleLogout} 
          className="btn btn-logout" 
          style={{ 
            width: '100%',
            padding: '0.75rem',
            fontSize: '1rem',
            fontWeight: '500'
          }}
        >
          Выйти
        </button>
      </div>
    </div>
  );
};

export default Profile;
