import React, { useState, useEffect } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import api from '../../services/api';
import CreateOrder from './CreateOrder';
import OrdersList from './OrdersList';
import Profile from '../Profile';

const CustomerDashboard = () => {
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    completed: 0,
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await api.get('/orders/my_orders/');
      const orders = response.data;
      
      setStats({
        total: orders.length,
        pending: orders.filter(o => o.status === 'pending' || o.status === 'taken' || o.status === 'in_progress').length,
        completed: orders.filter(o => o.status === 'completed').length,
      });
    } catch (error) {
      console.error('Ошибка загрузки статистики:', error);
    }
  };

  return (
    <Routes>
      <Route
        index
        element={
          <div>
            <h1 className="page-title">Кабинет заказчика</h1>
            
            <div className="grid grid-3 mb-2">
              <div className="card">
                <h3>Всего заказов</h3>
                <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>{stats.total}</p>
              </div>
              <div className="card">
                <h3>Активных</h3>
                <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>{stats.pending}</p>
              </div>
              <div className="card">
                <h3>Выполнено</h3>
                <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>{stats.completed}</p>
              </div>
            </div>

            <div className="card">
              <h2>Действия</h2>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <Link to="/customer/create-order" className="btn btn-primary">
                  Создать заказ
                </Link>
                <Link to="/customer/orders" className="btn btn-secondary">
                  Мои заказы
                </Link>
              </div>
            </div>
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
