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

  const cardStyle = {
    padding: '1rem',
    marginBottom: '0.75rem',
  };

  const titleStyle = {
    fontSize: '1.2rem',
    fontWeight: 'bold',
    margin: '0 0 0.75rem 0',
    color: '#333',
  };

  const infoRowStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.5rem 0',
    borderBottom: '1px solid #f0f0f0',
    fontSize: '0.9rem',
  };

  const labelStyle = {
    color: '#666',
    fontWeight: '500',
    minWidth: '100px',
  };

  const valueStyle = {
    color: '#333',
    textAlign: 'right',
    flex: 1,
  };

  return (
    <div>
      <h1 className="page-title" style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>
        Мои автомобили
      </h1>

      {cars.length === 0 ? (
        <div className="card text-center" style={{ padding: '1.5rem' }}>
          <p style={{ margin: '0 0 0.5rem 0', fontSize: '1rem' }}>
            У вас пока нет добавленных автомобилей
          </p>
          <p style={{ margin: 0, fontSize: '0.9rem', color: '#666' }}>
            Обратитесь к администратору для добавления автомобиля
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {cars.map((car) => (
            <div key={car.id} className="card" style={cardStyle}>
              <h3 style={titleStyle}>
                {car.brand} {car.model}
              </h3>

              <div style={infoRowStyle}>
                <span style={labelStyle}>Госномер:</span>
                <span style={{ ...valueStyle, fontWeight: 'bold', fontSize: '1rem' }}>
                  {car.license_plate}
                </span>
              </div>

              <div style={infoRowStyle}>
                <span style={labelStyle}>Цвет:</span>
                <span style={valueStyle}>{car.color}</span>
              </div>

              <div style={infoRowStyle}>
                <span style={labelStyle}>Класс:</span>
                <span style={valueStyle}>{car.car_class_data?.name || 'Не указан'}</span>
              </div>

              <div style={{ marginTop: '0.75rem', display: 'flex', justifyContent: 'flex-start' }}>
                <span
                  className={`badge ${
                    car.is_active ? 'badge-completed' : 'badge-cancelled'
                  }`}
                  style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}
                >
                  {car.is_active ? '✓ Активен' : '✗ Неактивен'}
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
