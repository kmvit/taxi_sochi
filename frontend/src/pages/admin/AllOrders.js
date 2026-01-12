import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import api from '../../services/api';

const AllOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const response = await api.get('/orders/');
      setOrders(response.data.results || response.data);
    } catch (error) {
      console.error('Ошибка загрузки заказов:', error);
    } finally {
      setLoading(false);
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

  const filteredOrders = orders.filter((order) => {
    if (filter === 'all') return true;
    return order.status === filter;
  });

  if (loading) {
    return <div className="loading">Загрузка...</div>;
  }

  return (
    <div>
      <h1 className="page-title">Все заказы</h1>

      <div className="card mb-2">
        <label className="form-label">Фильтр по статусу</label>
        <select
          className="form-control"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{ maxWidth: '300px' }}
        >
          <option value="all">Все заказы</option>
          <option value="pending">Ожидают водителя</option>
          <option value="taken">Взяты</option>
          <option value="in_progress">В пути</option>
          <option value="completed">Выполнены</option>
          <option value="cancelled">Отменены</option>
        </select>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="card text-center">
          <p>Нет заказов</p>
        </div>
      ) : (
        <div className="card">
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>№</th>
                  <th>Заказчик</th>
                  <th>Пассажир</th>
                  <th>Маршрут</th>
                  <th>Время</th>
                  <th>Класс</th>
                  <th>Цена</th>
                  <th>Статус</th>
                  <th>Водитель</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.id}>
                    <td>{order.id}</td>
                    <td>{order.customer_data?.username || '-'}</td>
                    <td>
                      {order.passenger_name}
                      <br />
                      <small>{order.passenger_phone}</small>
                    </td>
                    <td>
                      {order.zone_from_data?.name} → {order.zone_to_data?.name}
                    </td>
                    <td>{format(new Date(order.pickup_time), 'dd.MM.yyyy HH:mm')}</td>
                    <td>{order.car_class_data?.name}</td>
                    <td>{order.price_client} ₽</td>
                    <td>{getStatusBadge(order.status)}</td>
                    <td>
                      {order.driver_data ? (
                        <>
                          {order.driver_data.full_name}
                          <br />
                          <small>{order.driver_data.phone}</small>
                        </>
                      ) : (
                        '-'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllOrders;
