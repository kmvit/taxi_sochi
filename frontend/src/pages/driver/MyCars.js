import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const MyCars = () => {
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCars();
  }, []);

  const loadCars = async () => {
    try {
      const response = await api.get('/cars/my_cars/');
      setCars(response.data);
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
      <h1 className="page-title">Мои автомобили</h1>

      {cars.length === 0 ? (
        <div className="card text-center">
          <p>У вас пока нет добавленных автомобилей</p>
          <p>Обратитесь к администратору для добавления автомобиля</p>
        </div>
      ) : (
        <div className="grid grid-2">
          {cars.map((car) => (
            <div key={car.id} className="card">
              <h3 style={{ margin: '0 0 1rem 0' }}>
                {car.brand} {car.model}
              </h3>

              <div style={{ marginBottom: '0.5rem' }}>
                <strong>Цвет:</strong> {car.color}
              </div>

              <div style={{ marginBottom: '0.5rem' }}>
                <strong>Госномер:</strong> {car.license_plate}
              </div>

              <div style={{ marginBottom: '0.5rem' }}>
                <strong>Класс:</strong> {car.car_class_data?.name}
              </div>

              <div style={{ marginTop: '1rem' }}>
                <span
                  className={`badge ${
                    car.is_active ? 'badge-completed' : 'badge-cancelled'
                  }`}
                >
                  {car.is_active ? 'Активен' : 'Неактивен'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyCars;
