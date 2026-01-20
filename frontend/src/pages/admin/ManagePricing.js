import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const ManagePricing = () => {
  const navigate = useNavigate();
  const [pricing, setPricing] = useState([]);
  const [zones, setZones] = useState([]);
  const [carClasses, setCarClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPrice, setEditingPrice] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState({
    zone_from: '',
    zone_to: '',
    car_class: '',
    price_client: '',
    price_driver: '',
    is_active: true,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [pricingRes, zonesRes, classesRes] = await Promise.all([
        api.get('/pricing/'),
        api.get('/zones/'),
        api.get('/car-classes/'),
      ]);
      
      setPricing(pricingRes.data.results || pricingRes.data);
      setZones(zonesRes.data.results || zonesRes.data);
      setCarClasses(classesRes.data.results || classesRes.data);
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
      setError('Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  };

  const loadPricing = async () => {
    try {
      const response = await api.get('/pricing/');
      setPricing(response.data.results || response.data);
    } catch (error) {
      console.error('Ошибка загрузки прайс-листа:', error);
    }
  };

  const handleOpenModal = (price = null) => {
    if (price) {
      setEditingPrice(price);
      setFormData({
        zone_from: price.zone_from || '',
        zone_to: price.zone_to || '',
        car_class: price.car_class || '',
        price_client: price.price_client || '',
        price_driver: price.price_driver || '',
        is_active: price.is_active,
      });
    } else {
      setEditingPrice(null);
      setFormData({
        zone_from: '',
        zone_to: '',
        car_class: '',
        price_client: '',
        price_driver: '',
        is_active: true,
      });
    }
    setShowModal(true);
    setError('');
    setSuccess('');
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingPrice(null);
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

    // Валидация
    if (!formData.zone_from || !formData.zone_to || !formData.car_class) {
      setError('Заполните все обязательные поля');
      return;
    }

    if (formData.zone_from === formData.zone_to) {
      setError('Зоны отправления и прибытия не могут совпадать');
      return;
    }

    if (parseFloat(formData.price_client) <= 0) {
      setError('Цена для клиента должна быть больше нуля');
      return;
    }

    if (formData.price_driver && parseFloat(formData.price_driver) <= 0) {
      setError('Цена для водителя должна быть больше нуля');
      return;
    }

    try {
      const submitData = {
        ...formData,
        price_client: parseFloat(formData.price_client),
        price_driver: formData.price_driver ? parseFloat(formData.price_driver) : null,
      };

      if (editingPrice) {
        await api.put(`/pricing/${editingPrice.id}/`, submitData);
        setSuccess('Цена успешно обновлена');
      } else {
        await api.post('/pricing/', submitData);
        setSuccess('Цена успешно создана');
      }
      
      await loadPricing();
      setTimeout(() => {
        handleCloseModal();
      }, 1500);
    } catch (error) {
      console.error('Ошибка сохранения цены:', error);
      setError(
        error.response?.data?.detail ||
        error.response?.data?.non_field_errors?.[0] ||
        'Ошибка сохранения цены'
      );
    }
  };

  const handleDelete = async (price) => {
    if (!window.confirm(`Вы уверены, что хотите удалить цену ${price.zone_from_data?.name} → ${price.zone_to_data?.name}?`)) {
      return;
    }

    try {
      await api.delete(`/pricing/${price.id}/`);
      setSuccess('Цена успешно удалена');
      await loadPricing();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Ошибка удаления цены:', error);
      setError('Ошибка удаления цены');
      setTimeout(() => setError(''), 3000);
    }
  };

  if (loading) {
    return <div className="loading">Загрузка...</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 className="page-title" style={{ margin: 0 }}>Прайс-лист</h1>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-secondary" onClick={() => navigate('/admin/zones')}>
            🗺️ Управление зонами
          </button>
          <button className="btn btn-primary" onClick={() => handleOpenModal()}>
            + Добавить цену
          </button>
        </div>
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

      {pricing.length === 0 ? (
        <div className="card text-center">
          <p>Прайс-лист пуст</p>
        </div>
      ) : (
        <div className="card">
          <div style={{ overflowX: 'auto' }}>
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
                  <th>Действия</th>
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
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          className="btn btn-secondary"
                          onClick={() => handleOpenModal(price)}
                          style={{ padding: '0.4rem 0.8rem' }}
                        >
                          Изменить
                        </button>
                        <button
                          className="btn btn-danger"
                          onClick={() => handleDelete(price)}
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
              <h2>{editingPrice ? 'Редактировать цену' : 'Добавить цену'}</h2>
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
                <label className="form-label">Откуда (зона) *</label>
                <select
                  name="zone_from"
                  className="form-control"
                  value={formData.zone_from}
                  onChange={handleChange}
                  required
                >
                  <option value="">Выберите зону</option>
                  {zones.map((zone) => (
                    <option key={zone.id} value={zone.id}>
                      {zone.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Куда (зона) *</label>
                <select
                  name="zone_to"
                  className="form-control"
                  value={formData.zone_to}
                  onChange={handleChange}
                  required
                >
                  <option value="">Выберите зону</option>
                  {zones.map((zone) => (
                    <option key={zone.id} value={zone.id}>
                      {zone.name}
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
                <label className="form-label">Цена для клиента (₽) *</label>
                <input
                  type="number"
                  name="price_client"
                  className="form-control"
                  value={formData.price_client}
                  onChange={handleChange}
                  required
                  min="1"
                  step="1"
                  placeholder="1500"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Цена для водителя (₽)</label>
                <input
                  type="number"
                  name="price_driver"
                  className="form-control"
                  value={formData.price_driver}
                  onChange={handleChange}
                  min="1"
                  step="1"
                  placeholder="1200"
                />
                <small style={{ color: '#666', fontSize: '0.85rem' }}>
                  Опционально. Если не указано, водитель видит цену клиента.
                </small>
              </div>

              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleChange}
                  />
                  <span>Активна</span>
                </label>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                  Отмена
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingPrice ? 'Сохранить' : 'Создать'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagePricing;
