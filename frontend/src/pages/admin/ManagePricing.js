import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const ManagePricing = () => {
  const [pricing, setPricing] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPricing();
  }, []);

  const loadPricing = async () => {
    try {
      const response = await api.get('/pricing/');
      setPricing(response.data.results || response.data);
    } catch (error) {
      console.error('Ошибка загрузки прайс-листа:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Загрузка...</div>;
  }

  return (
    <div>
      <h1 className="page-title">Прайс-лист</h1>

      <div className="alert alert-info mb-2">
        <p style={{ margin: 0 }}>
          Для добавления, редактирования и удаления цен используйте Django Admin
          панель: <a href="http://localhost:8000/admin/pricing/pricing/" target="_blank" rel="noopener noreferrer">/admin/pricing/pricing/</a>
        </p>
      </div>

      {pricing.length === 0 ? (
        <div className="card text-center">
          <p>Прайс-лист пуст</p>
        </div>
      ) : (
        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Откуда</th>
                <th>Куда</th>
                <th>Класс</th>
                <th>Цена клиент</th>
                <th>Цена водитель</th>
                <th>Статус</th>
              </tr>
            </thead>
            <tbody>
              {pricing.map((price) => (
                <tr key={price.id}>
                  <td>{price.id}</td>
                  <td>{price.zone_from_data?.name}</td>
                  <td>{price.zone_to_data?.name}</td>
                  <td>{price.car_class_data?.name}</td>
                  <td>{price.price_client} ₽</td>
                  <td>{price.price_driver || '-'} ₽</td>
                  <td>
                    <span
                      className={`badge ${
                        price.is_active ? 'badge-completed' : 'badge-cancelled'
                      }`}
                    >
                      {price.is_active ? 'Активна' : 'Неактивна'}
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

export default ManagePricing;
