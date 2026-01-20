import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import ZoneMap from '../../components/ZoneMap';

const ManageZones = () => {
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedZone, setSelectedZone] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#3b82f6',
    is_active: true,
    geometry: null,
    center_lat: null,
    center_lon: null,
  });

  useEffect(() => {
    loadZones();
  }, []);

  const loadZones = async () => {
    try {
      const response = await api.get('/zones/');
      setZones(response.data.results || response.data);
    } catch (error) {
      console.error('Ошибка загрузки зон:', error);
      setError('Ошибка загрузки зон');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (zone = null) => {
    if (zone) {
      setSelectedZone(zone);
      setFormData({
        name: zone.name || '',
        description: zone.description || '',
        color: zone.color || '#3b82f6',
        is_active: zone.is_active,
        geometry: zone.geometry,
        center_lat: zone.center_lat,
        center_lon: zone.center_lon,
      });
      setIsEditing(true);
    } else {
      setSelectedZone({ color: '#3b82f6' });
      setFormData({
        name: '',
        description: '',
        color: '#3b82f6',
        is_active: true,
        geometry: null,
        center_lat: null,
        center_lon: null,
      });
      setIsEditing(false);
    }
    setShowModal(true);
    setError('');
    setSuccess('');
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedZone(null);
    setIsEditing(false);
    setIsSaving(false);
    setError('');
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    
    // Обновляем цвет для предпросмотра на карте
    if (name === 'color' && selectedZone) {
      setSelectedZone(prev => ({ ...prev, color: value }));
    }
  };

  const handleZoneGeometryChange = useCallback((geometryData) => {
    // Не обновляем геометрию во время сохранения
    if (isSaving) return;
    
    setFormData((prev) => ({
      ...prev,
      geometry: geometryData.geometry,
      center_lat: geometryData.center_lat,
      center_lon: geometryData.center_lon,
    }));
  }, [isSaving]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsSaving(true);

    // Валидация
    if (!formData.name.trim()) {
      setError('Введите название зоны');
      setIsSaving(false);
      return;
    }

    if (!formData.geometry) {
      setError('Нарисуйте границы зоны на карте');
      setIsSaving(false);
      return;
    }

    // Проверяем корректность геометрии
    if (!formData.geometry.coordinates || 
        !formData.geometry.coordinates[0] || 
        formData.geometry.coordinates[0].length < 4) {
      setError('Полигон должен содержать минимум 3 точки');
      setIsSaving(false);
      return;
    }

    if (!formData.center_lat || !formData.center_lon) {
      setError('Не определены координаты центра зоны');
      setIsSaving(false);
      return;
    }

    try {
      // Подготавливаем данные для отправки
      const dataToSend = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        color: formData.color,
        is_active: formData.is_active,
        geometry: formData.geometry,
        center_lat: formData.center_lat,
        center_lon: formData.center_lon,
      };

      console.log('Отправка данных зоны:', dataToSend);

      if (isEditing && selectedZone.id) {
        await api.put(`/zones/${selectedZone.id}/`, dataToSend);
        setSuccess('Зона успешно обновлена');
      } else {
        await api.post('/zones/', dataToSend);
        setSuccess('Зона успешно создана');
      }

      await loadZones();
      setTimeout(() => {
        setIsSaving(false);
        handleCloseModal();
      }, 1500);
    } catch (error) {
      console.error('Ошибка сохранения зоны:', error);
      console.error('Детали ошибки:', error.response?.data);
      setError(
        error.response?.data?.detail ||
        error.response?.data?.name?.[0] ||
        error.response?.data?.geometry?.[0] ||
        error.message ||
        'Ошибка сохранения зоны'
      );
      setIsSaving(false);
    }
  };

  const handleDelete = async (zone) => {
    if (!window.confirm(`Вы уверены, что хотите удалить зону "${zone.name}"?`)) {
      return;
    }

    try {
      await api.delete(`/zones/${zone.id}/`);
      setSuccess('Зона успешно удалена');
      await loadZones();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Ошибка удаления зоны:', error);
      const errorMessage = error.response?.data?.detail || 
                          error.response?.data?.message ||
                          'Ошибка удаления зоны';
      setError(errorMessage);
      setTimeout(() => setError(''), 5000);
    }
  };

  const handleSelectZone = (zone) => {
    setSelectedZone(zone);
  };

  if (loading) {
    return <div className="loading">Загрузка...</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 className="page-title" style={{ margin: 0 }}>Управление зонами</h1>
        <button className="btn btn-primary" onClick={() => handleOpenModal()}>
          + Добавить зону
        </button>
      </div>

      {success && !showModal && (
        <div className="alert alert-success">
          {success}
        </div>
      )}

      {error && !showModal && (
        <div className="alert alert-danger">
          {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Список зон */}
        <div className="card">
          <h2 className="card-title">Список зон</h2>
          {zones.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#666' }}>Зоны не созданы</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {zones.map((zone) => (
                <div
                  key={zone.id}
                  onClick={() => handleSelectZone(zone)}
                  style={{
                    padding: '1rem',
                    border: `2px solid ${selectedZone?.id === zone.id ? zone.color : '#e5e7eb'}`,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    backgroundColor: selectedZone?.id === zone.id ? '#f9fafb' : 'white',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                        <div
                          style={{
                            width: '16px',
                            height: '16px',
                            borderRadius: '4px',
                            backgroundColor: zone.color,
                            border: '1px solid rgba(0,0,0,0.1)'
                          }}
                        />
                        <strong>{zone.name}</strong>
                      </div>
                      {zone.description && (
                        <p style={{ margin: '0.25rem 0', fontSize: '0.85rem', color: '#666' }}>
                          {zone.description}
                        </p>
                      )}
                      <div style={{ marginTop: '0.5rem' }}>
                        <span
                          className={`badge ${zone.is_active ? 'badge-completed' : 'badge-cancelled'}`}
                          style={{ fontSize: '0.75rem' }}
                        >
                          {zone.is_active ? 'Активна' : 'Неактивна'}
                        </span>
                        {!zone.geometry && (
                          <span className="badge badge-pending" style={{ fontSize: '0.75rem', marginLeft: '0.5rem' }}>
                            Без границ
                          </span>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', marginLeft: '0.5rem' }}>
                      <button
                        className="btn btn-secondary"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenModal(zone);
                        }}
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                      >
                        ✏️
                      </button>
                      <button
                        className="btn btn-danger"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(zone);
                        }}
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Карта */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <ZoneMap
            zones={zones}
            selectedZone={selectedZone}
            editable={false}
          />
        </div>
      </div>

      {/* Модальное окно */}
      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div 
            className="modal-content" 
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '90vw', width: '1200px', maxHeight: '90vh', overflow: 'auto' }}
          >
            <div className="modal-header">
              <h2>{isEditing ? 'Редактировать зону' : 'Создать зону'}</h2>
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
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem' }}>
                {/* Форма */}
                <div>
                  <div className="form-group">
                    <label className="form-label">Название зоны *</label>
                    <input
                      type="text"
                      name="name"
                      className="form-control"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      placeholder="Например: Центр Сочи"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Описание</label>
                    <textarea
                      name="description"
                      className="form-control"
                      value={formData.description}
                      onChange={handleChange}
                      rows="3"
                      placeholder="Краткое описание зоны"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Цвет на карте</label>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <input
                        type="color"
                        name="color"
                        value={formData.color}
                        onChange={handleChange}
                        style={{ width: '60px', height: '40px', cursor: 'pointer' }}
                      />
                      <input
                        type="text"
                        name="color"
                        className="form-control"
                        value={formData.color}
                        onChange={handleChange}
                        placeholder="#3b82f6"
                        pattern="^#[0-9A-Fa-f]{6}$"
                      />
                    </div>
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

                  {formData.geometry && (
                    <div className="alert alert-success" style={{ fontSize: '0.85rem' }}>
                      ✓ Границы зоны определены
                    </div>
                  )}
                </div>

                {/* Карта для рисования */}
                <div style={{ height: '500px', borderRadius: '8px', overflow: 'hidden' }}>
                  <ZoneMap
                    zones={isEditing && selectedZone.id ? [{ ...selectedZone, ...formData }] : []}
                    selectedZone={{ ...selectedZone, ...formData }}
                    editable={true}
                    onZoneChange={handleZoneGeometryChange}
                  />
                </div>
              </div>

              <div className="modal-footer" style={{ marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                  Отмена
                </button>
                <button type="submit" className="btn btn-primary">
                  {isEditing ? 'Сохранить' : 'Создать'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageZones;
