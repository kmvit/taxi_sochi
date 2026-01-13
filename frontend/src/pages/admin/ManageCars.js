import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const ManageCars = () => {
  const [cars, setCars] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [carClasses, setCarClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCar, setEditingCar] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState({
    driver: '',
    car_class: '',
    brand: '',
    model: '',
    color: '',
    license_plate: '',
    is_active: true,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [carsRes, driversRes, classesRes] = await Promise.all([
        api.get('/cars/'),
        api.get('/drivers/'),
        api.get('/car-classes/'),
      ]);
      
      setCars(carsRes.data.results || carsRes.data);
      setDrivers(driversRes.data.results || driversRes.data);
      setCarClasses(classesRes.data.results || classesRes.data);
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
      setError('Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  };

  const loadCars = async () => {
    try {
      const response = await api.get('/cars/');
      setCars(response.data.results || response.data);
    } catch (error) {
      console.error('Ошибка загрузки автомобилей:', error);
    }
  };

  const handleOpenModal = (car = null) => {
    if (car) {
      setEditingCar(car);
      setFormData({
        driver: car.driver || '',
        car_class: car.car_class || '',
        brand: car.brand || '',
        model: car.model || '',
        color: car.color || '',
        license_plate: car.license_plate || '',
        is_active: car.is_active,
      });
    } else {
      setEditingCar(null);
      setFormData({
        driver: '',
        car_class: '',
        brand: '',
        model: '',
        color: '',
        license_plate: '',
        is_active: true,
      });
    }
    setShowModal(true);
    setError('');
    setSuccess('');
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCar(null);
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
      if (editingCar) {
        await api.put(`/cars/${editingCar.id}/`, formData);
        setSuccess('Автомобиль успешно обновлен');
      } else {
        await api.post('/cars/', formData);
        setSuccess('Автомобиль успешно создан');
      }
      
      await loadCars();
      setTimeout(() => {
        handleCloseModal();
      }, 1500);
    } catch (error) {
      console.error('Ошибка сохранения автомобиля:', error);
      setError(
        error.response?.data?.detail ||
        error.response?.data?.license_plate?.[0] ||
        'Ошибка сохранения автомобиля'
      );
    }
  };

  const handleDelete = async (car) => {
    if (!window.confirm(`Вы уверены, что хотите удалить автомобиль ${car.full_name}?`)) {
      return;
    }

    try {
      await api.delete(`/cars/${car.id}/`);
      setSuccess('Автомобиль успешно удален');
      await loadCars();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Ошибка удаления автомобиля:', error);
      setError('Ошибка удаления автомобиля');
      setTimeout(() => setError(''), 3000);
    }
  };

  if (loading) {
    return <div className="loading">Загрузка...</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 className="page-title" style={{ margin: 0 }}>Управление автомобилями</h1>
        <button className="btn btn-primary" onClick={() => handleOpenModal()}>
          + Добавить автомобиль
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

      {cars.length === 0 ? (
        <div className="card text-center">
          <p>Нет автомобилей</p>
        </div>
      ) : (
        <div className="card">
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Автомобиль</th>
                  <th>Госномер</th>
                  <th>Класс</th>
                  <th>Водитель</th>
                  <th>Статус</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {cars.map((car) => (
                  <tr key={car.id}>
                    <td>{car.id}</td>
                    <td>
                      {car.color} {car.brand} {car.model}
                    </td>
                    <td>{car.license_plate}</td>
                    <td>{car.car_class_data?.name || '-'}</td>
                    <td>{car.driver_data?.full_name || '-'}</td>
                    <td>
                      <span
                        className={`badge ${
                          car.is_active ? 'badge-completed' : 'badge-cancelled'
                        }`}
                      >
                        {car.is_active ? 'Активен' : 'Неактивен'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          className="btn btn-secondary"
                          onClick={() => handleOpenModal(car)}
                          style={{ padding: '0.4rem 0.8rem' }}
                        >
                          Изменить
                        </button>
                        <button
                          className="btn btn-danger"
                          onClick={() => handleDelete(car)}
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
              <h2>{editingCar ? 'Редактировать автомобиль' : 'Добавить автомобиль'}</h2>
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
                <label className="form-label">Водитель *</label>
                <select
                  name="driver"
                  className="form-control"
                  value={formData.driver}
                  onChange={handleChange}
                  required
                >
                  <option value="">Выберите водителя</option>
                  {drivers.map((driver) => (
                    <option key={driver.id} value={driver.id}>
                      {driver.full_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Класс автомобиля *</label>
                <select
                  name="car_class"
                  className="form-control"
                  value={formData.car_class}
                  onChange={handleChange}
                  required
                >
                  <option value="">Выберите класс</option>
                  {carClasses.map((carClass) => (
                    <option key={carClass.id} value={carClass.id}>
                      {carClass.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Марка *</label>
                <input
                  type="text"
                  name="brand"
                  className="form-control"
                  value={formData.brand}
                  onChange={handleChange}
                  required
                  placeholder="Toyota"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Модель *</label>
                <input
                  type="text"
                  name="model"
                  className="form-control"
                  value={formData.model}
                  onChange={handleChange}
                  required
                  placeholder="Camry"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Цвет *</label>
                <input
                  type="text"
                  name="color"
                  className="form-control"
                  value={formData.color}
                  onChange={handleChange}
                  required
                  placeholder="Черный"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Госномер *</label>
                <input
                  type="text"
                  name="license_plate"
                  className="form-control"
                  value={formData.license_plate}
                  onChange={handleChange}
                  required
                  placeholder="А123БВ123"
                />
              </div>

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
                  {editingCar ? 'Сохранить' : 'Создать'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageCars;
