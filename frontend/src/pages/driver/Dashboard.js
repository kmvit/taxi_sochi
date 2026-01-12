import React, { useState, useEffect } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import api from '../../services/api';
import AvailableOrders from './AvailableOrders';
import MyOrders from './MyOrders';
import MyCars from './MyCars';
import Profile from '../Profile';

const DriverDashboard = () => {
  const [stats, setStats] = useState({
    available: 0,
    my_active: 0,
    completed: 0,
    earnings: 0,
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [availableRes, myOrdersRes] = await Promise.all([
        api.get('/orders/available/'),
        api.get('/orders/my_orders/'),
      ]);

      const myOrders = myOrdersRes.data;
      const completedOrders = myOrders.filter((o) => o.status === 'completed');
      
      // Считаем сумму заработка из выполненных заказов
      const earnings = completedOrders.reduce((sum, order) => {
        const price = order.price_driver || order.price_client || 0;
        return sum + parseFloat(price);
      }, 0);

      setStats({
        available: availableRes.data.length,
        my_active: myOrders.filter(
          (o) => o.status === 'taken' || o.status === 'in_progress'
        ).length,
        completed: completedOrders.length,
        earnings: earnings,
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
            <h1 className="page-title">Кабинет водителя</h1>

            <div className="grid grid-stats mb-2">
              <div className="card card-stat">
                <div className="stat-label">Доступных заказов</div>
                <div className="stat-value">{stats.available}</div>
              </div>
              <div className="card card-stat">
                <div className="stat-label">Активных заказов</div>
                <div className="stat-value">{stats.my_active}</div>
              </div>
              <div className="card card-stat">
                <div className="stat-label">Выполнено</div>
                <div className="stat-value">{stats.completed}</div>
              </div>
              <div className="card card-stat card-stat-earnings">
                <div className="stat-label">Заработок</div>
                <div className="stat-value stat-value-earnings">
                  {stats.earnings.toLocaleString('ru-RU')} ₽
                </div>
              </div>
            </div>

            <div className="card">
              <h2>Действия</h2>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <Link to="/driver/available" className="btn btn-primary">
                  Доступные заказы
                </Link>
                <Link to="/driver/my-orders" className="btn btn-secondary">
                  Мои заказы
                </Link>
                <Link to="/driver/my-cars" className="btn btn-secondary">
                  Мои автомобили
                </Link>
                <Link to="/driver/profile" className="btn btn-secondary">
                  Профиль
                </Link>
              </div>
            </div>
          </div>
        }
      />
      <Route path="available" element={<AvailableOrders />} />
      <Route path="my-orders" element={<MyOrders />} />
      <Route path="my-cars" element={<MyCars />} />
      <Route path="profile" element={<Profile />} />
    </Routes>
  );
};

export default DriverDashboard;
