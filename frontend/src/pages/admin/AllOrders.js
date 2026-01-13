import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import api from '../../services/api';

const AllOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [drivers, setDrivers] = useState([]);

  useEffect(() => {
    loadOrders();
    loadDrivers();
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

  const loadDrivers = async () => {
    try {
      const response = await api.get('/drivers/');
      setDrivers(response.data.results || response.data);
    } catch (error) {
      console.error('Ошибка загрузки водителей:', error);
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

  const handleOpenModal = (order) => {
    setEditingOrder(order);
    setShowModal(true);
    setError('');
    setSuccess('');
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingOrder(null);
    setError('');
  };

  const handleStatusChange = async (newStatus) => {
    if (!editingOrder) return;

    try {
      await api.post(`/orders/${editingOrder.id}/update_status/`, {
        status: newStatus,
      });
      setSuccess('Статус заказа успешно обновлен');
      await loadOrders();
      setTimeout(() => {
        handleCloseModal();
      }, 1500);
    } catch (error) {
      console.error('Ошибка обновления статуса:', error);
      setError(error.response?.data?.detail || 'Ошибка обновления статуса');
    }
  };

  const handleAssignDriver = async (driverId) => {
    if (!editingOrder) return;

    try {
      // Обновляем заказ, назначая водителя
      await api.patch(`/orders/${editingOrder.id}/`, {
        driver: driverId,
        status: 'taken',
      });
      setSuccess('Водитель успешно назначен');
      await loadOrders();
      setTimeout(() => {
        handleCloseModal();
      }, 1500);
    } catch (error) {
      console.error('Ошибка назначения водителя:', error);
      setError(error.response?.data?.detail || 'Ошибка назначения водителя');
    }
  };

  const handleCancelOrder = async () => {
    if (!editingOrder) return;
    
    if (!window.confirm('Вы уверены, что хотите отменить заказ?')) {
      return;
    }

    try {
      await api.post(`/orders/${editingOrder.id}/update_status/`, {
        status: 'cancelled',
      });
      setSuccess('Заказ успешно отменен');
      await loadOrders();
      setTimeout(() => {
        handleCloseModal();
      }, 1500);
    } catch (error) {
      console.error('Ошибка отмены заказа:', error);
      setError(error.response?.data?.detail || 'Ошибка отмены заказа');
    }
  };

  const handleDeleteOrder = async () => {
    if (!editingOrder) return;
    
    if (!window.confirm('Вы уверены, что хотите УДАЛИТЬ заказ? Это действие необратимо!')) {
      return;
    }

    try {
      await api.delete(`/orders/${editingOrder.id}/`);
      setSuccess('Заказ успешно удален');
      await loadOrders();
      handleCloseModal();
    } catch (error) {
      console.error('Ошибка удаления заказа:', error);
      setError(error.response?.data?.detail || 'Ошибка удаления заказа');
    }
  };

  if (loading) {
    return <div className="loading">Загрузка...</div>;
  }

  return (
    <div>
      <h1 className="page-title">Все заказы</h1>

      {success && !showModal && (
        <div className="alert alert-success">
          {success}
        </div>
      )}

      {error && !showModal && (
        <div className="alert alert-danger">
          {error}
        </div>
      )}

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
                  <th>Действия</th>
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
                    <td>
                      <button
                        className="btn btn-secondary"
                        onClick={() => handleOpenModal(order)}
                        style={{ padding: '0.4rem 0.8rem' }}
                      >
                        Изменить
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Модальное окно редактирования заказа */}
      {showModal && editingOrder && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Редактирование заказа #{editingOrder.id}</h2>
              <button className="modal-close" onClick={handleCloseModal}>
                ×
              </button>
            </div>
            
            {error && (
              <div className="alert alert-danger">
                {error}
              </div>
            )}

            {success && (
              <div className="alert alert-success">
                {success}
              </div>
            )}

            <div className="order-details">
              <div className="form-group">
                <label className="form-label">Пассажир</label>
                <div className="form-control" style={{ backgroundColor: '#f5f5f5' }}>
                  {editingOrder.passenger_name} ({editingOrder.passenger_phone})
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Маршрут</label>
                <div className="form-control" style={{ backgroundColor: '#f5f5f5' }}>
                  {editingOrder.zone_from_data?.name} → {editingOrder.zone_to_data?.name}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Время подачи</label>
                <div className="form-control" style={{ backgroundColor: '#f5f5f5' }}>
                  {format(new Date(editingOrder.pickup_time), 'dd.MM.yyyy HH:mm')}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Класс автомобиля</label>
                <div className="form-control" style={{ backgroundColor: '#f5f5f5' }}>
                  {editingOrder.car_class_data?.name}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Цена для клиента</label>
                <div className="form-control" style={{ backgroundColor: '#f5f5f5' }}>
                  {editingOrder.price_client} ₽
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Текущий статус</label>
                <div>
                  {getStatusBadge(editingOrder.status)}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Текущий водитель</label>
                <div className="form-control" style={{ backgroundColor: '#f5f5f5' }}>
                  {editingOrder.driver_data ? editingOrder.driver_data.full_name : 'Не назначен'}
                </div>
              </div>

              <hr />

              <h3 style={{ marginTop: '1.5rem', marginBottom: '1rem' }}>Управление заказом</h3>

              <div className="form-group">
                <label className="form-label">Назначить водителя</label>
                <select
                  className="form-control"
                  onChange={(e) => {
                    if (e.target.value) {
                      handleAssignDriver(e.target.value);
                    }
                  }}
                  defaultValue=""
                >
                  <option value="">Выберите водителя</option>
                  {drivers.filter(d => d.is_active).map((driver) => (
                    <option key={driver.id} value={driver.id}>
                      {driver.full_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Изменить статус</label>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button
                    className="btn btn-secondary"
                    onClick={() => handleStatusChange('pending')}
                    disabled={editingOrder.status === 'pending'}
                    style={{ padding: '0.5rem 1rem' }}
                  >
                    Ожидает
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() => handleStatusChange('taken')}
                    disabled={editingOrder.status === 'taken'}
                    style={{ padding: '0.5rem 1rem' }}
                  >
                    Взят
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() => handleStatusChange('in_progress')}
                    disabled={editingOrder.status === 'in_progress'}
                    style={{ padding: '0.5rem 1rem' }}
                  >
                    В пути
                  </button>
                  <button
                    className="btn btn-success"
                    onClick={() => handleStatusChange('completed')}
                    disabled={editingOrder.status === 'completed'}
                    style={{ padding: '0.5rem 1rem' }}
                  >
                    Выполнен
                  </button>
                </div>
              </div>

              <div className="form-group">
                <button
                  className="btn btn-danger"
                  onClick={handleCancelOrder}
                  disabled={editingOrder.status === 'cancelled'}
                  style={{ width: '100%' }}
                >
                  Отменить заказ
                </button>
              </div>

              <div className="form-group" style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #ddd' }}>
                <label className="form-label" style={{ color: '#dc3545', fontWeight: 'bold' }}>
                  Опасная зона
                </label>
                <button
                  className="btn btn-danger"
                  onClick={handleDeleteOrder}
                  style={{ width: '100%', backgroundColor: '#a02020' }}
                >
                  🗑️ Удалить заказ навсегда
                </button>
                <small style={{ color: '#666', display: 'block', marginTop: '0.5rem' }}>
                  Внимание: удаленный заказ невозможно восстановить
                </small>
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllOrders;
