import React, { useState, useEffect } from 'react';
import { format, startOfDay, parseISO, isSameDay } from 'date-fns';
import api from '../../services/api';

const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState('');

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    filterOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orders, selectedDate]);

  const loadOrders = async () => {
    try {
      const response = await api.get('/orders/my_orders/');
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

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      await api.post(`/orders/${orderId}/update_status/`, { status: newStatus });
      alert('Статус успешно обновлен!');
      loadOrders();
    } catch (error) {
      alert(error.response?.data?.detail || 'Ошибка обновления статуса');
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Вы уверены, что хотите отменить этот заказ? Он станет доступным для других водителей.')) {
      return;
    }

    try {
      const response = await api.post(`/orders/${orderId}/cancel/`);
      alert(response.data?.detail || 'Заказ успешно отменен');
      loadOrders();
    } catch (error) {
      alert(error.response?.data?.detail || 'Ошибка отмены заказа');
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
    return <span className={`badge ${s.class}`}>{s.text}</span>;
  };

  const getNextStatus = (currentStatus) => {
    if (currentStatus === 'taken') return 'in_progress';
    if (currentStatus === 'in_progress') return 'completed';
    return null;
  };

  const getNextStatusText = (currentStatus) => {
    const next = getNextStatus(currentStatus);
    if (next === 'in_progress') return 'Еду к клиенту';
    if (next === 'completed') return 'Выполнено';
    return null;
  };

  if (loading) {
    return <div className="loading">Загрузка...</div>;
  }

  return (
    <div>
      <h1 className="page-title">Мои поездки</h1>

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
          <p>У вас пока нет взятых заказов</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="card text-center">
          <p>Нет заказов за выбранный период</p>
        </div>
      ) : (
        <div className="grid">
          {filteredOrders.map((order) => (
            <div key={order.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0 }}>Заказ #{order.id}</h3>
                {getStatusBadge(order.status)}
              </div>

              <div style={{ marginBottom: '0.5rem' }}>
                <strong>Пассажир:</strong> {order.passenger_name}
                <br />
                <strong>Телефон:</strong> {order.passenger_phone}
                <br />
                <strong>Количество:</strong> {order.passenger_count} чел.
              </div>

              <div style={{ marginBottom: '0.5rem' }}>
                <strong>Маршрут:</strong> {order.zone_from_data?.name} →{' '}
                {order.zone_to_data?.name}
              </div>

              {order.address_from && (
                <div style={{ marginBottom: '0.5rem' }}>
                  <strong>Откуда:</strong> {order.address_from}
                </div>
              )}

              {order.address_to && (
                <div style={{ marginBottom: '0.5rem' }}>
                  <strong>Куда:</strong> {order.address_to}
                </div>
              )}

              <div style={{ marginBottom: '0.5rem' }}>
                <strong>Время подачи:</strong>{' '}
                {format(new Date(order.pickup_time), 'dd.MM.yyyy, HH:mm')}
              </div>

              <div style={{ marginBottom: '0.5rem' }}>
                <strong>Класс:</strong> {order.car_class_data?.name}
              </div>

              {order.flight_number && (
                <div style={{ marginBottom: '0.5rem' }}>
                  <strong>Авиарейс:</strong> {order.flight_number}
                </div>
              )}

              {order.comment && (
                <div style={{ marginBottom: '0.5rem' }}>
                  <strong>Комментарий:</strong> {order.comment}
                </div>
              )}

              <div style={{ marginTop: '1rem', fontSize: '1.2rem', fontWeight: 'bold' }}>
                Оплата: {order.price_driver || order.price_client} ₽
              </div>

              <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {getNextStatus(order.status) && (
                  <button
                    onClick={() => handleUpdateStatus(order.id, getNextStatus(order.status))}
                    className="btn btn-primary"
                  >
                    {getNextStatusText(order.status)}
                  </button>
                )}
                
                {(order.status === 'taken' || order.status === 'in_progress') && (
                  <button
                    onClick={() => handleCancelOrder(order.id)}
                    className="btn btn-secondary"
                    style={{ backgroundColor: '#dc3545', borderColor: '#dc3545' }}
                  >
                    Отменить заказ
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyOrders;
