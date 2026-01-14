import React, { useState, useEffect } from 'react';
import { 
  getNotificationStatus, 
  initializeNotifications, 
  cleanupNotifications 
} from '../services/notifications';
import '../styles/NotificationSettings.css';

const NotificationSettings = () => {
  const [notificationStatus, setNotificationStatus] = useState('default');
  const [isInitializing, setIsInitializing] = useState(false);

  useEffect(() => {
    updateStatus();
  }, []);

  const updateStatus = () => {
    const status = getNotificationStatus();
    setNotificationStatus(status);
  };

  const handleEnableNotifications = async () => {
    setIsInitializing(true);
    
    try {
      const result = await initializeNotifications();
      
      if (result.success) {
        alert('Уведомления успешно включены!');
      } else {
        alert(`Не удалось включить уведомления: ${result.message}`);
      }
      
      updateStatus();
    } catch (error) {
      alert('Ошибка при включении уведомлений');
      console.error(error);
    } finally {
      setIsInitializing(false);
    }
  };

  const handleDisableNotifications = async () => {
    setIsInitializing(true);
    
    try {
      await cleanupNotifications();
      alert('Уведомления отключены');
      updateStatus();
    } catch (error) {
      alert('Ошибка при отключении уведомлений');
      console.error(error);
    } finally {
      setIsInitializing(false);
    }
  };

  const getStatusText = () => {
    switch (notificationStatus) {
      case 'granted':
        return 'Уведомления включены';
      case 'denied':
        return 'Уведомления заблокированы';
      case 'not-supported':
        return 'Уведомления не поддерживаются';
      default:
        return 'Уведомления отключены';
    }
  };

  const getStatusClass = () => {
    switch (notificationStatus) {
      case 'granted':
        return 'status-enabled';
      case 'denied':
        return 'status-blocked';
      case 'not-supported':
        return 'status-not-supported';
      default:
        return 'status-default';
    }
  };

  if (notificationStatus === 'not-supported') {
    return (
      <div className="notification-settings">
        <h3>Push-уведомления</h3>
        <div className="notification-status status-not-supported">
          <span className="status-icon">⚠️</span>
          <span className="status-text">
            Ваш браузер не поддерживает push-уведомления
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="notification-settings">
      <h3>Push-уведомления</h3>
      
      <div className={`notification-status ${getStatusClass()}`}>
        <span className="status-icon">
          {notificationStatus === 'granted' ? '✅' : 
           notificationStatus === 'denied' ? '🚫' : '🔔'}
        </span>
        <span className="status-text">{getStatusText()}</span>
      </div>

      <div className="notification-description">
        <p>
          Получайте мгновенные уведомления о новых заказах, 
          изменениях статуса и другую важную информацию.
        </p>
      </div>

      <div className="notification-actions">
        {notificationStatus === 'granted' ? (
          <button 
            className="btn-disable"
            onClick={handleDisableNotifications}
            disabled={isInitializing}
          >
            {isInitializing ? 'Отключение...' : 'Отключить уведомления'}
          </button>
        ) : notificationStatus === 'denied' ? (
          <div className="blocked-message">
            <p>
              Уведомления заблокированы в настройках браузера.
              Чтобы включить их, разрешите уведомления для этого сайта 
              в настройках браузера.
            </p>
          </div>
        ) : (
          <button 
            className="btn-enable"
            onClick={handleEnableNotifications}
            disabled={isInitializing}
          >
            {isInitializing ? 'Включение...' : 'Включить уведомления'}
          </button>
        )}
      </div>

      {notificationStatus === 'granted' && (
        <div className="notification-info">
          <h4>Вы будете получать уведомления о:</h4>
          <ul>
            <li>Новых доступных заказах (для водителей)</li>
            <li>Отмене заказов другими водителями</li>
            <li>Изменениях в заказах</li>
            <li>Новых заказах в системе (для администраторов)</li>
            <li>Завершении заказов</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default NotificationSettings;
