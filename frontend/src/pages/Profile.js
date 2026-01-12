import React from 'react';
import { useAuth } from '../context/AuthContext';

const Profile = () => {
  const { user } = useAuth();

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
      <h1 className="page-title">Профиль</h1>

      <div className="card">
        <h2>Личная информация</h2>
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
    </div>
  );
};

export default Profile;
