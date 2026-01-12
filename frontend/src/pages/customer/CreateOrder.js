import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import api from '../../services/api';

const CreateOrder = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [zones, setZones] = useState([]);
  const [carClasses, setCarClasses] = useState([]);
  const [price, setPrice] = useState(null);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    passenger_name: '',
    passenger_phone: '',
    passenger_count: 1,
    zone_from: '',
    zone_to: '',
    address_from: '',
    address_to: '',
    pickup_time: '',
    direction: 'oneway',
    car_class: '',
    flight_number: '',
    comment: '',
    payment_method: 'mock',
  });

  useEffect(() => {
    loadZones();
    loadCarClasses();
  }, []);

  useEffect(() => {
    if (formData.zone_from && formData.zone_to && formData.car_class) {
      calculatePrice();
    }
  }, [formData.zone_from, formData.zone_to, formData.car_class]);

  const loadZones = async () => {
    try {
      const response = await api.get('/zones/');
      setZones(response.data.results || response.data);
    } catch (error) {
      console.error('Ошибка загрузки зон:', error);
    }
  };

  const loadCarClasses = async () => {
    try {
      const response = await api.get('/car-classes/');
      setCarClasses(response.data.results || response.data);
    } catch (error) {
      console.error('Ошибка загрузки классов авто:', error);
    }
  };

  const calculatePrice = async () => {
    try {
      const response = await api.post('/pricing/get_price/', {
        zone_from: parseInt(formData.zone_from),
        zone_to: parseInt(formData.zone_to),
        car_class: parseInt(formData.car_class),
      });
      setPrice(response.data.price_client);
    } catch (error) {
      setPrice(null);
      console.error('Ошибка расчета цены:', error);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.post('/orders/', formData);
      alert('Заказ успешно создан!');
      navigate('/customer/orders');
    } catch (err) {
      setError(err.response?.data?.detail || 'Ошибка создания заказа');
    } finally {
      setLoading(false);
    }
  };

  // Минимальное время - текущее + 1 час
  const minDateTime = format(new Date(Date.now() + 60 * 60 * 1000), "yyyy-MM-dd'T'HH:mm");

  return (
    <div>
      <h1 className="page-title">Создать заказ</h1>

      {error && <div className="alert alert-danger">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="card">
          <h2 className="card-title">Информация о пассажире</h2>

          <div className="form-group">
            <label className="form-label">ФИО пассажира*</label>
            <input
              type="text"
              name="passenger_name"
              className="form-control"
              value={formData.passenger_name}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Телефон пассажира*</label>
            <input
              type="tel"
              name="passenger_phone"
              className="form-control"
              value={formData.passenger_phone}
              onChange={handleChange}
              required
              disabled={loading}
              placeholder="+7..."
            />
          </div>

          <div className="form-group">
            <label className="form-label">Количество пассажиров*</label>
            <input
              type="number"
              name="passenger_count"
              className="form-control"
              value={formData.passenger_count}
              onChange={handleChange}
              min="1"
              required
              disabled={loading}
            />
          </div>
        </div>

        <div className="card">
          <h2 className="card-title">Маршрут</h2>

          <div className="form-group">
            <label className="form-label">Откуда*</label>
            <select
              name="zone_from"
              className="form-control"
              value={formData.zone_from}
              onChange={handleChange}
              required
              disabled={loading}
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
            <label className="form-label">Адрес откуда (детали)</label>
            <textarea
              name="address_from"
              className="form-control"
              value={formData.address_from}
              onChange={handleChange}
              disabled={loading}
              placeholder="Например: Терминал 1, выход 3"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Куда*</label>
            <select
              name="zone_to"
              className="form-control"
              value={formData.zone_to}
              onChange={handleChange}
              required
              disabled={loading}
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
            <label className="form-label">Адрес куда (детали)</label>
            <textarea
              name="address_to"
              className="form-control"
              value={formData.address_to}
              onChange={handleChange}
              disabled={loading}
              placeholder="Например: ул. Ленина, 5"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Направление*</label>
            <select
              name="direction"
              className="form-control"
              value={formData.direction}
              onChange={handleChange}
              required
              disabled={loading}
            >
              <option value="oneway">Только туда</option>
              <option value="roundtrip">Туда и обратно</option>
            </select>
          </div>
        </div>

        <div className="card">
          <h2 className="card-title">Автомобиль и время</h2>

          <div className="form-group">
            <label className="form-label">Класс автомобиля*</label>
            <select
              name="car_class"
              className="form-control"
              value={formData.car_class}
              onChange={handleChange}
              required
              disabled={loading}
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
            <label className="form-label">Время подачи* (минимум +1 час)</label>
            <input
              type="datetime-local"
              name="pickup_time"
              className="form-control"
              value={formData.pickup_time}
              onChange={handleChange}
              min={minDateTime}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Номер авиарейса</label>
            <input
              type="text"
              name="flight_number"
              className="form-control"
              value={formData.flight_number}
              onChange={handleChange}
              disabled={loading}
              placeholder="Например: SU 6561"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Комментарий</label>
            <textarea
              name="comment"
              className="form-control"
              value={formData.comment}
              onChange={handleChange}
              disabled={loading}
            />
          </div>
        </div>

        {price && (
          <div className="alert alert-info">
            <h3 style={{ margin: '0 0 0.5rem 0' }}>Стоимость поездки</h3>
            <p style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>
              {price} ₽
            </p>
          </div>
        )}

        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || !price}
          >
            {loading ? 'Создание...' : 'Создать заказ'}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate('/customer')}
            disabled={loading}
          >
            Отмена
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateOrder;
