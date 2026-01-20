import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import api from '../../services/api';
import AllOrders from './AllOrders';
import ManageDrivers from './ManageDrivers';
import ManageCars from './ManageCars';
import ManagePricing from './ManagePricing';
import ManageZones from './ManageZones';
import Profile from '../Profile';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    total_orders: 0,
    pending_orders: 0,
    total_drivers: 0,
    total_cars: 0,
    total_revenue: 0,
    total_profit: 0,
  });
  const [driverEarnings, setDriverEarnings] = useState([]);

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

      // Подсчет финансовой статистики
      let totalRevenue = 0;
      let totalProfit = 0;
      
      orders.forEach((order) => {
        const customerPrice = parseFloat(order.price_client) || 0;
        const driverPrice = parseFloat(order.price_driver) || 0;
        totalRevenue += customerPrice;
        totalProfit += (customerPrice - driverPrice);
      });

      // Подсчет заработка по водителям
      const earningsMap = {};
      const driverNamesMap = {};
      const orderCountMap = {};
      
      orders.forEach((order) => {
        if (order.driver && order.price_driver) {
          const driverId = order.driver;
          const driverPrice = parseFloat(order.price_driver) || 0;
          
          if (!earningsMap[driverId]) {
            earningsMap[driverId] = 0;
            orderCountMap[driverId] = 0;
          }
          earningsMap[driverId] += driverPrice;
          orderCountMap[driverId] += 1;
          
          // Сохраняем имя водителя из заказа, если доступно
          if (order.driver_data && !driverNamesMap[driverId]) {
            driverNamesMap[driverId] = order.driver_data.full_name || 
              `${order.driver_data.first_name || ''} ${order.driver_data.last_name || ''}`.trim();
          }
        }
      });

      // Создаем массив с данными о заработке водителей
      const driverEarningsList = Object.keys(earningsMap)
        .map((driverId) => {
          const driverIdNum = parseInt(driverId);
          const driver = drivers.find((d) => d.id === driverIdNum);
          
          // Приоритет: имя из заказа > имя из списка водителей > дефолтное
          let driverName = driverNamesMap[driverId];
          if (!driverName && driver) {
            driverName = driver.full_name || 
              `${driver.first_name || ''} ${driver.last_name || ''}`.trim() || 
              driver.user_data?.username;
          }
          if (!driverName) {
            driverName = `Водитель #${driverId}`;
          }
          
          return {
            id: driverIdNum,
            name: driverName,
            earnings: earningsMap[driverId],
            orderCount: orderCountMap[driverId],
          };
        })
        .sort((a, b) => b.earnings - a.earnings);

      setStats({
        total_orders: orders.length,
        pending_orders: orders.filter((o) => o.status === 'pending').length,
        total_drivers: drivers.length,
        total_cars: cars.length,
        total_revenue: totalRevenue,
        total_profit: totalProfit,
      });
      setDriverEarnings(driverEarningsList);
    } catch (error) {
      console.error('Ошибка загрузки статистики:', error);
    }
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
              Панель администратора
            </h1>

            {/* Финансовая статистика */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
              <div className="card" style={{ ...compactCardStyle, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                <h3 style={{ ...compactTitleStyle, color: 'rgba(255,255,255,0.9)' }}>Общая сумма</h3>
                <p style={compactValueStyle}>₽{stats.total_revenue.toFixed(0)}</p>
              </div>
              <div className="card" style={{ ...compactCardStyle, background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
                <h3 style={{ ...compactTitleStyle, color: 'rgba(255,255,255,0.9)' }}>Заработок</h3>
                <p style={compactValueStyle}>₽{stats.total_profit.toFixed(0)}</p>
              </div>
            </div>

            {/* Основная статистика */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
              <div className="card" style={compactCardStyle}>
                <h3 style={compactTitleStyle}>Заказов</h3>
                <p style={compactValueStyle}>{stats.total_orders}</p>
              </div>
              <div className="card" style={compactCardStyle}>
                <h3 style={compactTitleStyle}>Ожидают</h3>
                <p style={compactValueStyle}>{stats.pending_orders}</p>
              </div>
              <div className="card" style={compactCardStyle}>
                <h3 style={compactTitleStyle}>Водителей</h3>
                <p style={compactValueStyle}>{stats.total_drivers}</p>
              </div>
              <div className="card" style={compactCardStyle}>
                <h3 style={compactTitleStyle}>Машин</h3>
                <p style={compactValueStyle}>{stats.total_cars}</p>
              </div>
            </div>

            {/* Заработок водителей */}
            {driverEarnings.length > 0 && (
              <div className="card" style={{ padding: '1rem', marginBottom: '1rem' }}>
                <h2 style={{ fontSize: '1.1rem', marginBottom: '0.75rem' }}>Заработок водителей</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {driverEarnings.map((driver) => (
                    <div
                      key={driver.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0.6rem',
                        background: '#f8f9fa',
                        borderRadius: '4px',
                        fontSize: '0.9rem',
                      }}
                    >
                      <div style={{ flex: 1, overflow: 'hidden' }}>
                        <div style={{ fontWeight: '500', color: '#333', marginBottom: '0.2rem' }}>
                          {driver.name}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#666' }}>
                          {driver.orderCount} {driver.orderCount === 1 ? 'заказ' : driver.orderCount < 5 ? 'заказа' : 'заказов'}
                        </div>
                      </div>
                      <div style={{ fontWeight: 'bold', color: '#28a745', fontSize: '1rem', marginLeft: '0.5rem' }}>
                        ₽{driver.earnings.toFixed(0)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="alert alert-info" style={{ padding: '0.75rem', fontSize: '0.85rem' }}>
              <p style={{ margin: 0 }}>
                <strong>Совет:</strong> Используйте{' '}
                <a href="/admin" target="_blank" rel="noopener noreferrer">
                  Django Admin
                </a>
                {' '}для расширенного управления
              </p>
            </div>
          </div>
        }
      />
      <Route path="orders" element={<AllOrders />} />
      <Route path="drivers" element={<ManageDrivers />} />
      <Route path="cars" element={<ManageCars />} />
      <Route path="pricing" element={<ManagePricing />} />
      <Route path="zones" element={<ManageZones />} />
      <Route path="profile" element={<Profile />} />
    </Routes>
  );
};

export default AdminDashboard;
