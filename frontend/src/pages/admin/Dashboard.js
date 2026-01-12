import React, { useState, useEffect } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import api from '../../services/api';
import AllOrders from './AllOrders';
import ManageDrivers from './ManageDrivers';
import ManageCars from './ManageCars';
import ManagePricing from './ManagePricing';
import Profile from '../Profile';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    total_orders: 0,
    pending_orders: 0,
    total_drivers: 0,
    total_cars: 0,
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [ordersRes, driversRes, carsRes] = await Promise.all([
        api.get('/orders/'),
        api.get('/drivers/'),
        api.get('/cars/'),
      ]);

      const orders = ordersRes.data.results || ordersRes.data;
      const drivers = driversRes.data.results || driversRes.data;
      const cars = carsRes.data.results || carsRes.data;

      setStats({
        total_orders: orders.length,
        pending_orders: orders.filter((o) => o.status === 'pending').length,
        total_drivers: drivers.length,
        total_cars: cars.length,
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
            <h1 className="page-title">Панель администратора</h1>

            <div className="grid grid-2 mb-2">
              <div className="card">
                <h3>Всего заказов</h3>
                <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>
                  {stats.total_orders}
                </p>
              </div>
              <div className="card">
                <h3>Ожидают водителя</h3>
                <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>
                  {stats.pending_orders}
                </p>
              </div>
              <div className="card">
                <h3>Водителей</h3>
                <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>
                  {stats.total_drivers}
                </p>
              </div>
              <div className="card">
                <h3>Автомобилей</h3>
                <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>
                  {stats.total_cars}
                </p>
              </div>
            </div>

            <div className="card">
              <h2>Управление</h2>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <Link to="/admin/orders" className="btn btn-primary">
                  Все заказы
                </Link>
                <Link to="/admin/drivers" className="btn btn-secondary">
                  Водители
                </Link>
                <Link to="/admin/cars" className="btn btn-secondary">
                  Автомобили
                </Link>
                <Link to="/admin/pricing" className="btn btn-secondary">
                  Прайс-лист
                </Link>
              </div>
            </div>

            <div className="alert alert-info">
              <p style={{ margin: 0 }}>
                <strong>Совет:</strong> Для полного управления используйте Django Admin
                панель по адресу{' '}
                <a href="http://localhost:8000/admin" target="_blank" rel="noopener noreferrer">
                  /admin
                </a>
              </p>
            </div>
          </div>
        }
      />
      <Route path="orders" element={<AllOrders />} />
      <Route path="drivers" element={<ManageDrivers />} />
      <Route path="cars" element={<ManageCars />} />
      <Route path="pricing" element={<ManagePricing />} />
      <Route path="profile" element={<Profile />} />
    </Routes>
  );
};

export default AdminDashboard;
