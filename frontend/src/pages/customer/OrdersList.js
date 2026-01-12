import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import api from '../../services/api';

const OrdersList = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, []);

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

  if (loading) {
    return <div className="loading">Загрузка...</div>;
  }

  return (
    <div>
      <h1 className="page-title">Мои заказы</h1>

      {orders.length === 0 ? (
        <div className="card text-center">
          <p>У вас пока нет заказов</p>
        </div>
      ) : (
        <div className="card">
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>№</th>
                  <th>Маршрут</th>
                  <th>Пассажир</th>
                  <th>Время подачи</th>
                  <th>Класс</th>
                  <th>Цена</th>
                  <th>Статус</th>
                  <th>Водитель</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td>{order.id}</td>
                    <td>
                      {order.zone_from_data?.name} → {order.zone_to_data?.name}
                    </td>
                    <td>
                      {order.passenger_name}
                      <br />
                      <small>{order.passenger_phone}</small>
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
                        <span style={{ color: '#999' }}>Не назначен</span>
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

export default OrdersList;
