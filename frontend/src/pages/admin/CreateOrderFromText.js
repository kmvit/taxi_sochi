import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const CreateOrderFromText = () => {
  const navigate = useNavigate();
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [zonesNotFound, setZonesNotFound] = useState(null);
  const [availableZones, setAvailableZones] = useState([]);
  const [parsedData, setParsedData] = useState(null);
  const [carClassNotFound, setCarClassNotFound] = useState(null);
  const [availableCarClasses, setAvailableCarClasses] = useState([]);
  const [selectedZoneFrom, setSelectedZoneFrom] = useState('');
  const [selectedZoneTo, setSelectedZoneTo] = useState('');

  const exampleText = `Пассажиры: Литвин Владислав Владимирович +79186422555 +79296442647
Примечание: ОБЯЗАТЕЛЬНО МАРШРУТНЫЙ ЛИСТ!!! ЗАПРЕТ НА ЖЕЛТЫЕ АВТО

Откуда: город Сочи
Отель Golden Tulip, Набережная Панорама, 3

Куда: город Сочи
Аэропорт Сочи (AER)

Время подачи: 24.11.2025, 09:30
Направление: Только туда
Класс автомобиля: Комфорт
Количество пассажиров: 1
Авиарейс: 1137
Время отбытия самолёта: 13:20`;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!text.trim()) {
      setError('Введите текст заказа');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    setZonesNotFound(null);
    setCarClassNotFound(null);
    setSelectedZoneFrom('');
    setSelectedZoneTo('');

    try {
      const requestData = {
        text: text,
      };

      // Если были выбраны зоны вручную, добавляем их
      if (selectedZoneFrom) {
        requestData.zone_from_id = parseInt(selectedZoneFrom);
      }
      if (selectedZoneTo) {
        requestData.zone_to_id = parseInt(selectedZoneTo);
      }

      const response = await api.post('/orders/create-from-text/', requestData);
      
      setSuccess('Заказ успешно создан!');
      setText('');
      setParsedData(null);
      
      // Редирект на список заказов через 2 секунды
      setTimeout(() => {
        navigate('/dashboard/orders');
      }, 2000);
    } catch (err) {
      const errorData = err.response?.data;
      
      if (errorData?.zones_not_found) {
        // Зоны не найдены - показываем список для выбора
        setZonesNotFound(errorData.zones_not_found);
        setAvailableZones(errorData.available_zones || []);
        setParsedData(errorData.parsed_data);
        setError(errorData.detail || 'Зоны не найдены по адресам');
      } else if (errorData?.available_car_classes) {
        // Класс авто не найден - показываем список для выбора
        setCarClassNotFound(errorData.detail);
        setAvailableCarClasses(errorData.available_car_classes || []);
        setParsedData(errorData.parsed_data);
        setError(errorData.detail);
      } else {
        setError(errorData?.detail || errorData?.message || 'Ошибка создания заказа');
        if (errorData?.parsed_data) {
          setParsedData(errorData.parsed_data);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleZoneSelection = async () => {
    if (!selectedZoneFrom || !selectedZoneTo) {
      setError('Выберите обе зоны');
      return;
    }

    // Повторно отправляем запрос с выбранными зонами
    setLoading(true);
    setError('');
    setZonesNotFound(null);

    try {
      const requestData = {
        text: text,
        zone_from_id: parseInt(selectedZoneFrom),
        zone_to_id: parseInt(selectedZoneTo),
      };

      const response = await api.post('/orders/create-from-text/', requestData);
      
      setSuccess('Заказ успешно создан!');
      setText('');
      setParsedData(null);
      
      setTimeout(() => {
        navigate('/dashboard/orders');
      }, 2000);
    } catch (err) {
      const errorData = err.response?.data;
      setError(errorData?.detail || 'Ошибка создания заказа');
    } finally {
      setLoading(false);
    }
  };

  const handleCarClassSelection = async (carClassId) => {
    // Обновляем текст с правильным классом авто
    const carClass = availableCarClasses.find(c => c.id === carClassId);
    if (!carClass) return;

    // Заменяем класс авто в тексте
    const updatedText = text.replace(
      /Класс автомобиля:\s*[^\n]+/i,
      `Класс автомобиля: ${carClass.name}`
    );
    setText(updatedText);

    // Повторно отправляем запрос
    setLoading(true);
    setError('');
    setCarClassNotFound(null);

    try {
      const requestData = {
        text: updatedText,
      };

      if (selectedZoneFrom) {
        requestData.zone_from_id = parseInt(selectedZoneFrom);
      }
      if (selectedZoneTo) {
        requestData.zone_to_id = parseInt(selectedZoneTo);
      }

      const response = await api.post('/orders/create-from-text/', requestData);
      
      setSuccess('Заказ успешно создан!');
      setText('');
      setParsedData(null);
      
      setTimeout(() => {
        navigate('/dashboard/orders');
      }, 2000);
    } catch (err) {
      const errorData = err.response?.data;
      if (errorData?.zones_not_found) {
        setZonesNotFound(errorData.zones_not_found);
        setAvailableZones(errorData.available_zones || []);
        setParsedData(errorData.parsed_data);
        setError(errorData.detail || 'Зоны не найдены по адресам');
      } else {
        setError(errorData?.detail || 'Ошибка создания заказа');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="page-title">Создание заказа из текста</h1>

      {success && (
        <div className="alert alert-success">
          {success}
        </div>
      )}

      {error && (
        <div className="alert alert-danger">
          {error}
        </div>
      )}

      <div className="card" style={{ marginBottom: '1rem' }}>
        <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Инструкция</h2>
        <p style={{ marginBottom: '0.5rem' }}>
          Вставьте текст заказа в следующем формате:
        </p>
        <pre style={{ 
          background: '#f5f5f5', 
          padding: '1rem', 
          borderRadius: '4px',
          overflowX: 'auto',
          fontSize: '0.9rem'
        }}>
          {exampleText}
        </pre>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => setText(exampleText)}
          style={{ marginTop: '0.5rem' }}
        >
          Вставить пример
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="card">
          <div className="form-group">
            <label className="form-label">Текст заказа</label>
            <textarea
              className="form-control"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={15}
              placeholder="Вставьте текст заказа здесь..."
              style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || !text.trim()}
            style={{ width: '100%' }}
          >
            {loading ? 'Обработка...' : 'Распарсить и создать заказ'}
          </button>
        </div>
      </form>

      {/* Выбор зон, если они не найдены */}
      {zonesNotFound && availableZones.length > 0 && (
        <div className="card" style={{ marginTop: '1rem', border: '2px solid #ffc107' }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: '#856404' }}>
            Зоны не найдены автоматически
          </h2>
          <p style={{ marginBottom: '1rem' }}>
            Выберите зоны вручную:
          </p>

          {zonesNotFound.includes('from') && (
            <div className="form-group">
              <label className="form-label">Откуда:</label>
              <select
                className="form-control"
                value={selectedZoneFrom}
                onChange={(e) => setSelectedZoneFrom(e.target.value)}
              >
                <option value="">Выберите зону...</option>
                {availableZones.map((zone) => (
                  <option key={zone.id} value={zone.id}>
                    {zone.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {zonesNotFound.includes('to') && (
            <div className="form-group">
              <label className="form-label">Куда:</label>
              <select
                className="form-control"
                value={selectedZoneTo}
                onChange={(e) => setSelectedZoneTo(e.target.value)}
              >
                <option value="">Выберите зону...</option>
                {availableZones.map((zone) => (
                  <option key={zone.id} value={zone.id}>
                    {zone.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            type="button"
            className="btn btn-primary"
            onClick={handleZoneSelection}
            disabled={loading || !selectedZoneFrom || !selectedZoneTo}
            style={{ width: '100%', marginTop: '1rem' }}
          >
            {loading ? 'Создание...' : 'Создать заказ с выбранными зонами'}
          </button>
        </div>
      )}

      {/* Выбор класса авто, если он не найден */}
      {carClassNotFound && availableCarClasses.length > 0 && (
        <div className="card" style={{ marginTop: '1rem', border: '2px solid #ffc107' }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: '#856404' }}>
            Класс автомобиля не найден
          </h2>
          <p style={{ marginBottom: '1rem' }}>
            Выберите класс автомобиля:
          </p>

          <div className="form-group">
            <select
              className="form-control"
              onChange={(e) => {
                if (e.target.value) {
                  handleCarClassSelection(parseInt(e.target.value));
                }
              }}
              defaultValue=""
            >
              <option value="">Выберите класс...</option>
              {availableCarClasses.map((carClass) => (
                <option key={carClass.id} value={carClass.id}>
                  {carClass.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Показ распарсенных данных (для отладки) */}
      {parsedData && process.env.NODE_ENV === 'development' && (
        <div className="card" style={{ marginTop: '1rem', background: '#f8f9fa' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Распарсенные данные:</h3>
          <pre style={{ fontSize: '0.8rem', overflowX: 'auto' }}>
            {JSON.stringify(parsedData, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default CreateOrderFromText;
