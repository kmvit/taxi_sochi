import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { format } from 'date-fns';
import api from '../../services/api';
import CreateOrder from './CreateOrder';
import OrdersList from './OrdersList';
import Profile from '../Profile';

const CustomerDashboard = () => {
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    completed: 0,
    total_spent: 0,
  });
  const [recentOrders, setRecentOrders] = useState([]);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await api.get('/orders/my_orders/');
      const orders = response.data;
      
      // Подсчет общей суммы потраченных средств
      const totalSpent = orders.reduce((sum, order) => {
        const price = parseFloat(order.price_client) || 0;
        return sum + price;
      }, 0);
      
      // Сохраняем последние 5 заказов
      const recent = orders
        .sort((a, b) => new Date(b.created_at || b.updated_at) - new Date(a.created_at || a.updated_at))
        .slice(0, 5);
      
      setStats({
        total: orders.length,
        pending: orders.filter(o => o.status === 'pending' || o.status === 'taken' || o.status === 'in_progress').length,
        completed: orders.filter(o => o.status === 'completed').length,
        total_spent: totalSpent,
      });
      setRecentOrders(recent);
    } catch (error) {
      console.error('Ошибка загрузки статистики:', error);
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: { text: 'Ожидает', class: 'badge-pending' },
      taken: { text: 'Взят', class: 'badge-taken' },
      in_progress: { text: 'В пути', class: 'badge-in-progress' },
      completed: { text: 'Выполнен', class: 'badge-completed' },
      cancelled: { text: 'Отменен', class: 'badge-cancelled' },
    };
    const s = statusMap[status] || { text: status, class: '' };
    return <span className={`badge ${s.class}`} style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}>{s.text}</span>;
  };

  const compactCardStyle = {
    padding: '0.75rem',
    textAlign: 'center',
  };

  const compactTitleStyle = {
    fontSize: '0.85rem',
    margin: '0 0 0.25rem 0',
    fontWeight: '500',
    color: '#666',
  };

  const compactValueStyle = {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    margin: 0,
    color: '#333',
  };

  return (
    <Routes>
      <Route
        index
        element={
          <div>
            <h1 className="page-title" style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>
              Кабинет заказчика
            </h1>

            {/* Финансовая статистика */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
              <div className="card" style={{ ...compactCardStyle, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                <h3 style={{ ...compactTitleStyle, color: 'rgba(255,255,255,0.9)' }}>Общая сумма</h3>
                <p style={compactValueStyle}>₽{stats.total_spent.toFixed(0)}</p>
              </div>
            </div>

            {/* Основная статистика */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
              <div className="card" style={compactCardStyle}>
                <h3 style={compactTitleStyle}>Заказов</h3>
                <p style={compactValueStyle}>{stats.total}</p>
              </div>
              <div className="card" style={compactCardStyle}>
                <h3 style={compactTitleStyle}>Активных</h3>
                <p style={compactValueStyle}>{stats.pending}</p>
              </div>
              <div className="card" style={compactCardStyle}>
                <h3 style={compactTitleStyle}>Выполнено</h3>
                <p style={compactValueStyle}>{stats.completed}</p>
              </div>
            </div>

            {/* Лента заказов */}
            {recentOrders.length > 0 && (
              <div className="card" style={{ padding: '1rem', marginBottom: '1rem' }}>
                <h2 style={{ fontSize: '1.1rem', marginBottom: '0.75rem' }}>Последние заказы</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {recentOrders.map((order) => (
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
                          <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.25rem' }}>
                            {format(new Date(order.pickup_time), 'dd.MM.yyyy, HH:mm')}
                          </div>
                          <div style={{ marginTop: '0.25rem' }}>
                            {getStatusBadge(order.status)}
                          </div>
                        </div>
                        <div style={{ fontWeight: 'bold', color: '#333', fontSize: '1rem', marginLeft: '0.5rem' }}>
                          ₽{parseFloat(order.price_client || 0).toFixed(0)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        }
      />
      <Route path="create-order" element={<CreateOrder />} />
      <Route path="orders" element={<OrdersList />} />
      <Route path="profile" element={<Profile />} />
    </Routes>
  );
};

export default CustomerDashboard;
