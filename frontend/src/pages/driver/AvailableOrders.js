import React, { useState, useEffect } from 'react';
import { format, startOfDay, parseISO, isSameDay } from 'date-fns';
import api from '../../services/api';

const AvailableOrders = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState('');

  useEffect(() => {
    loadOrders();
    // Обновляем список каждые 30 секунд
    const interval = setInterval(loadOrders, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    filterOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orders, selectedDate]);

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

  const filterOrders = () => {
    if (!selectedDate) {
      setFilteredOrders(orders);
      return;
    }

    const selected = startOfDay(parseISO(selectedDate));
    const filtered = orders.filter((order) => {
      const orderDate = parseISO(order.pickup_time);
      return isSameDay(orderDate, selected);
    });

    setFilteredOrders(filtered);
  };

  const handleClearFilters = () => {
    setSelectedDate('');
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

      <div className="card mb-2">
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ flex: '1', minWidth: '150px' }}>
            <label className="form-label">Дата</label>
            <input
              type="date"
              className="form-control"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
          {selectedDate && (
            <div className="form-group">
              <button onClick={handleClearFilters} className="btn btn-secondary">
                Сбросить
              </button>
            </div>
          )}
        </div>
        {selectedDate && (
          <div style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#666' }}>
            Найдено заказов: {filteredOrders.length} из {orders.length}
          </div>
        )}
      </div>

      {orders.length === 0 ? (
        <div className="card text-center">
          <p>Нет доступных заказов для ваших автомобилей</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="card text-center">
          <p>Нет заказов за выбранный период</p>
        </div>
      ) : (
        <div className="grid">
          {filteredOrders.map((order) => (
            <div key={order.id} className="card order-card">
              <div style={{ 
                fontSize: '1.2rem', 
                fontWeight: 'bold', 
                color: '#2563eb',
                marginBottom: '0.75rem'
              }}>
                {format(new Date(order.pickup_time), 'dd.MM HH:mm')}
              </div>

              <div className="order-route-compact" style={{ marginBottom: '0.5rem' }}>
                <span className="order-from">{order.zone_from_data?.name || order.address_from}</span>
                <span className="order-arrow">→</span>
                <span className="order-to">{order.zone_to_data?.name || order.address_to}</span>
              </div>

              <div className="order-meta" style={{ marginBottom: '0.5rem' }}>
                <span>Чел: {order.passenger_count}</span>
                {order.flight_number && <span>Рейс: {order.flight_number}</span>}
              </div>

              <div className="order-price-compact" style={{ 
                fontSize: '1.1rem', 
                fontWeight: 'bold',
                marginBottom: '1rem'
              }}>
                {parseFloat(order.price_driver || order.price_client).toFixed(2)} ₽
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
