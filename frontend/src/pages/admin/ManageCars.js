import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const ManageCars = () => {
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCars();
  }, []);

  const loadCars = async () => {
    try {
      const response = await api.get('/cars/');
      setCars(response.data.results || response.data);
    } catch (error) {
      console.error('Ошибка загрузки автомобилей:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Загрузка...</div>;
  }

  return (
    <div>
      <h1 className="page-title">Управление автомобилями</h1>

      <div className="alert alert-info mb-2">
        <p style={{ margin: 0 }}>
          Для добавления, редактирования и удаления автомобилей используйте Django Admin
          панель: <a href="http://localhost:8000/admin/cars/car/" target="_blank" rel="noopener noreferrer">/admin/cars/car/</a>
        </p>
      </div>

      {cars.length === 0 ? (
        <div className="card text-center">
          <p>Нет автомобилей</p>
        </div>
      ) : (
        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Автомобиль</th>
                <th>Госномер</th>
                <th>Класс</th>
                <th>Водитель</th>
                <th>Статус</th>
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ManageCars;
