import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const ManageDrivers = () => {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingDriver, setEditingDriver] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    first_name: '',
    last_name: '',
    middle_name: '',
    phone: '',
    is_active: true,
  });

  useEffect(() => {
    loadDrivers();
  }, []);

  const loadDrivers = async () => {
    try {
      const response = await api.get('/drivers/');
      setDrivers(response.data.results || response.data);
    } catch (error) {
      console.error('Ошибка загрузки водителей:', error);
      setError('Ошибка загрузки водителей');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (driver = null) => {
    if (driver) {
      setEditingDriver(driver);
      setFormData({
        username: driver.user_data?.username || '',
        password: '',
        first_name: driver.first_name || '',
        last_name: driver.last_name || '',
        middle_name: driver.middle_name || '',
        phone: driver.phone || '',
        is_active: driver.is_active,
      });
    } else {
      setEditingDriver(null);
      setFormData({
        username: '',
        password: '',
        first_name: '',
        last_name: '',
        middle_name: '',
        phone: '',
        is_active: true,
      });
    }
    setShowModal(true);
    setError('');
    setSuccess('');
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingDriver(null);
    setError('');
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      if (editingDriver) {
        // Редактирование водителя
        const updateData = {
          first_name: formData.first_name,
          last_name: formData.last_name,
          middle_name: formData.middle_name,
          phone: formData.phone,
          is_active: formData.is_active,
        };
        await api.put(`/drivers/${editingDriver.id}/`, updateData);
        setSuccess('Водитель успешно обновлен');
      } else {
        // Создание нового водителя
        if (!formData.password) {
          setError('Пароль обязателен для нового водителя');
          return;
        }
        await api.post('/drivers/', formData);
        setSuccess('Водитель успешно создан');
      }
      
      await loadDrivers();
      setTimeout(() => {
        handleCloseModal();
      }, 1500);
    } catch (error) {
      console.error('Ошибка сохранения водителя:', error);
      setError(
        error.response?.data?.detail ||
        error.response?.data?.username?.[0] ||
        'Ошибка сохранения водителя'
      );
    }
  };

  const handleDelete = async (driver) => {
    if (!window.confirm(`Вы уверены, что хотите удалить водителя ${driver.full_name}?`)) {
      return;
    }

    try {
      await api.delete(`/drivers/${driver.id}/`);
      setSuccess('Водитель успешно удален');
      await loadDrivers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Ошибка удаления водителя:', error);
      setError('Ошибка удаления водителя');
      setTimeout(() => setError(''), 3000);
    }
  };

  if (loading) {
    return <div className="loading">Загрузка...</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 className="page-title" style={{ margin: 0 }}>Управление водителями</h1>
        <button className="btn btn-primary" onClick={() => handleOpenModal()}>
          + Добавить водителя
        </button>
      </div>

      {success && (
        <div className="alert alert-success">
          {success}
        </div>
      )}

      {error && !showModal && (
        <div className="alert alert-danger">
          {error}
        </div>
      )}

      {drivers.length === 0 ? (
        <div className="card text-center">
          <p>Нет водителей</p>
        </div>
      ) : (
        <div className="card">
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>ФИО</th>
                  <th>Телефон</th>
                  <th>Пользователь</th>
                  <th>Статус</th>
                  <th>Дата создания</th>
                  <th>Действия</th>
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
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          className="btn btn-secondary"
                          onClick={() => handleOpenModal(driver)}
                          style={{ padding: '0.4rem 0.8rem' }}
                        >
                          Изменить
                        </button>
                        <button
                          className="btn btn-danger"
                          onClick={() => handleDelete(driver)}
                          style={{ padding: '0.4rem 0.8rem' }}
                        >
                          Удалить
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Модальное окно */}
      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingDriver ? 'Редактировать водителя' : 'Добавить водителя'}</h2>
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

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Имя *</label>
                <input
                  type="text"
                  name="first_name"
                  className="form-control"
                  value={formData.first_name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Фамилия *</label>
                <input
                  type="text"
                  name="last_name"
                  className="form-control"
                  value={formData.last_name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Отчество</label>
                <input
                  type="text"
                  name="middle_name"
                  className="form-control"
                  value={formData.middle_name}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Телефон *</label>
                <input
                  type="tel"
                  name="phone"
                  className="form-control"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  placeholder="+7 (xxx) xxx-xx-xx"
                />
              </div>

              {!editingDriver && (
                <>
                  <div className="form-group">
                    <label className="form-label">Логин *</label>
                    <input
                      type="text"
                      name="username"
                      className="form-control"
                      value={formData.username}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Пароль *</label>
                    <input
                      type="password"
                      name="password"
                      className="form-control"
                      value={formData.password}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </>
              )}

              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleChange}
                  />
                  <span>Активен</span>
                </label>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                  Отмена
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingDriver ? 'Сохранить' : 'Создать'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageDrivers;
