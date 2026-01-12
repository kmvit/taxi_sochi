import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const ManageDrivers = () => {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDrivers();
  }, []);

  const loadDrivers = async () => {
    try {
      const response = await api.get('/drivers/');
      setDrivers(response.data.results || response.data);
    } catch (error) {
      console.error('Ошибка загрузки водителей:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Загрузка...</div>;
  }

  return (
    <div>
      <h1 className="page-title">Управление водителями</h1>

      <div className="alert alert-info mb-2">
        <p style={{ margin: 0 }}>
          Для добавления, редактирования и удаления водителей используйте Django Admin
          панель: <a href="http://localhost:8000/admin/drivers/driver/" target="_blank" rel="noopener noreferrer">/admin/drivers/driver/</a>
        </p>
      </div>

      {drivers.length === 0 ? (
        <div className="card text-center">
          <p>Нет водителей</p>
        </div>
      ) : (
        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>ФИО</th>
                <th>Телефон</th>
                <th>Пользователь</th>
                <th>Статус</th>
                <th>Дата создания</th>
              </tr>
            </thead>
            <tbody>
              {drivers.map((driver) => (
                <tr key={driver.id}>
                  <td>{driver.id}</td>
                  <td>{driver.full_name}</td>
                  <td>{driver.phone}</td>
                  <td>{driver.user_data?.username || '-'}</td>
                  <td>
                    <span
                      className={`badge ${
                        driver.is_active ? 'badge-completed' : 'badge-cancelled'
                      }`}
                    >
                      {driver.is_active ? 'Активен' : 'Неактивен'}
                    </span>
                  </td>
                  <td>{new Date(driver.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ManageDrivers;
