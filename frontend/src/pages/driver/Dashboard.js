import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { format } from 'date-fns';
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
  const [completedOrders, setCompletedOrders] = useState([]);

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
      const completedOrdersList = myOrders.filter((o) => o.status === 'completed');
      
      // Считаем сумму заработка из выполненных заказов
      const earnings = completedOrdersList.reduce((sum, order) => {
        const price = order.price_driver || order.price_client || 0;
        return sum + parseFloat(price);
      }, 0);

      // Сохраняем последние 5 выполненных поездок
      const recentCompleted = completedOrdersList
        .sort((a, b) => new Date(b.completed_at || b.updated_at) - new Date(a.completed_at || a.updated_at))
        .slice(0, 5);

      setStats({
        available: availableRes.data.length,
        my_active: myOrders.filter(
          (o) => o.status === 'taken' || o.status === 'in_progress'
        ).length,
        completed: completedOrdersList.length,
        earnings: earnings,
      });
      setCompletedOrders(recentCompleted);
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

            {/* Лента выполненных поездок */}
            {completedOrders.length > 0 && (
              <div className="card" style={{ padding: '1rem', marginBottom: '1rem' }}>
                <h2 style={{ fontSize: '1.1rem', marginBottom: '0.75rem' }}>Выполненные поездки</h2>
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
              </div>
            )}
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
