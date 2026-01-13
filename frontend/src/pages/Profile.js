import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import api from '../services/api';

const Profile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  const [completedOrders, setCompletedOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.role === 'driver') {
      loadCompletedOrders();
    }
  }, [user]);

  const loadCompletedOrders = async () => {
    setLoading(true);
    try {
      const response = await api.get('/orders/my_orders/');
      const orders = response.data || [];
      const completed = orders
        .filter((o) => o.status === 'completed')
        .sort((a, b) => new Date(b.completed_at || b.updated_at) - new Date(a.completed_at || a.updated_at))
        .slice(0, 5); // Показываем только последние 5
      setCompletedOrders(completed);
    } catch (error) {
      console.error('Ошибка загрузки поездок:', error);
    } finally {
      setLoading(false);
    }
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

      {user.role === 'driver' && (
        <div className="card" style={{ padding: '1rem' }}>
          <h2 style={{ fontSize: '1.1rem', marginBottom: '0.75rem' }}>Выполненные поездки</h2>
          {loading ? (
            <div className="loading" style={{ minHeight: 'auto', padding: '1rem' }}>
              Загрузка...
            </div>
          ) : completedOrders.length === 0 ? (
            <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>
              У вас пока нет выполненных поездок
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {completedOrders.map((order) => (
                <div
                  key={order.id}
                  style={{
                    padding: '0.75rem',
                    background: '#f8f9fa',
                    borderRadius: '4px',
                    fontSize: '0.9rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '500', color: '#333', marginBottom: '0.25rem' }}>
                        {order.zone_from_data?.name} → {order.zone_to_data?.name}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#666' }}>
                        {format(new Date(order.completed_at || order.updated_at), 'dd.MM.yyyy, HH:mm')}
                      </div>
                    </div>
                    <div style={{ fontWeight: 'bold', color: '#28a745', fontSize: '1rem', marginLeft: '0.5rem' }}>
                      ₽{parseFloat(order.price_driver || order.price_client || 0).toFixed(0)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

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
