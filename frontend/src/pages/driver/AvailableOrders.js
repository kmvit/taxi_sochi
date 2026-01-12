import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import api from '../../services/api';

const AvailableOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
    // Обновляем список каждые 30 секунд
    const interval = setInterval(loadOrders, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadOrders = async () => {
    try {
      const response = await api.get('/orders/available/');
      setOrders(response.data);
    } catch (error) {
      console.error('Ошибка загрузки заказов:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTakeOrder = async (orderId) => {
    if (!window.confirm('Вы уверены, что хотите взять этот заказ?')) {
      return;
    }

    try {
      await api.post(`/orders/${orderId}/take/`);
      alert('Заказ успешно взят!');
      loadOrders(); // Обновляем список
    } catch (error) {
      alert(error.response?.data?.detail || 'Ошибка при взятии заказа');
    }
  };

  if (loading) {
    return <div className="loading">Загрузка...</div>;
  }

  return (
    <div>
      <h1 className="page-title">Доступные заказы</h1>

      {orders.length === 0 ? (
        <div className="card text-center">
          <p>Нет доступных заказов для ваших автомобилей</p>
        </div>
      ) : (
        <div className="grid">
          {orders.map((order) => (
            <div key={order.id} className="card order-card">
              <div className="order-route-compact">
                <span className="order-from">{order.zone_from_data?.name || order.address_from}</span>
                <span className="order-arrow">→</span>
                <span className="order-to">{order.zone_to_data?.name || order.address_to}</span>
              </div>

              <div className="order-meta">
                <span>Чел: {order.passenger_count}</span>
                {order.flight_number && <span>Рейс: {order.flight_number}</span>}
                <span>{format(new Date(order.pickup_time), 'dd.MM HH:mm')}</span>
              </div>

              <div className="order-price-compact">
                {order.price_driver || order.price_client} ₽
              </div>

              <div className="order-actions">
                <button
                  onClick={() => handleTakeOrder(order.id)}
                  className="btn btn-success"
                >
                  Взять заказ
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AvailableOrders;
