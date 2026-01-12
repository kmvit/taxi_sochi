import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import '../styles/InstallPrompt.css';

const InstallPrompt = () => {
  const { user } = useAuth();
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Проверяем, установлено ли приложение
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Проверяем iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(isIOSDevice);

    // Проверяем, видел ли пользователь промпт ранее (только для Android/Chrome)
    if (!isIOSDevice) {
      const hasSeenPrompt = localStorage.getItem('pwa-install-prompt-seen');
      if (hasSeenPrompt) {
        return;
      }
    }

    // Слушаем событие beforeinstallprompt (для Android/Chrome)
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Сохраняем в localStorage для использования после авторизации
      localStorage.setItem('pwa-deferred-prompt', 'available');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Проверяем, есть ли сохраненный промпт
    const hasDeferredPrompt = localStorage.getItem('pwa-deferred-prompt') === 'available';
    
    // Показываем промпт если пользователь авторизован и есть промпт
    if (user && (deferredPrompt || hasDeferredPrompt)) {
      setTimeout(() => {
        setShowPrompt(true);
      }, 2000);
    }

    // Для iOS показываем промпт после авторизации (если еще не показывали)
    if (isIOSDevice && user) {
      const hasSeenIOSPrompt = sessionStorage.getItem('pwa-ios-prompt-seen');
      if (!hasSeenIOSPrompt) {
        setTimeout(() => {
          setShowPrompt(true);
        }, 2000);
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [user]);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      // Если нет промпта, показываем инструкции
      alert('Для установки приложения используйте меню браузера: меню → "Установить приложение" или "Добавить на главный экран"');
      handleDismiss();
      return;
    }

    try {
      // Показываем промпт установки
      deferredPrompt.prompt();

      // Ждем ответа пользователя
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        console.log('Пользователь принял установку');
      } else {
        console.log('Пользователь отклонил установку');
      }

      // Очищаем промпт
      setDeferredPrompt(null);
      localStorage.removeItem('pwa-deferred-prompt');
    } catch (error) {
      console.error('Ошибка при показе промпта:', error);
      alert('Для установки приложения используйте меню браузера: меню → "Установить приложение" или "Добавить на главный экран"');
    }

    setShowPrompt(false);
    localStorage.setItem('pwa-install-prompt-seen', 'true');
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    if (isIOS) {
      sessionStorage.setItem('pwa-ios-prompt-seen', 'true');
    } else {
      localStorage.setItem('pwa-install-prompt-seen', 'true');
    }
  };

  // Не показываем, если приложение уже установлено
  if (isInstalled || !user) {
    return null;
  }

  // Для iOS показываем инструкции, для Android - нативный промпт
  if (isIOS) {
    if (!showPrompt) {
      return null;
    }
    return (
      <div className="install-prompt-overlay">
        <div className="install-prompt">
          <div className="install-prompt-content">
            <div className="install-prompt-icon">📱</div>
            <h3>Установите приложение</h3>
            <p>
              Нажмите кнопку <strong>"Поделиться"</strong> внизу экрана, затем выберите{' '}
              <strong>"На экран Домой"</strong> для установки приложения.
            </p>
            <div className="install-prompt-actions">
              <button onClick={handleDismiss} className="btn btn-primary">
                Понятно
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Для Android/Chrome показываем если есть промпт или сохраненный флаг
  const hasDeferredPrompt = deferredPrompt || localStorage.getItem('pwa-deferred-prompt') === 'available';
  if (!showPrompt || !hasDeferredPrompt) {
    return null;
  }

  return (
    <div className="install-prompt-overlay">
      <div className="install-prompt">
        <div className="install-prompt-content">
          <div className="install-prompt-icon">📱</div>
          <h3>Установите приложение</h3>
          <p>
            Установите Taxi Sochi на свой телефон для более удобного доступа.
            Приложение будет работать офлайн и быстрее загружаться.
          </p>
          <div className="install-prompt-actions">
            <button onClick={handleInstall} className="btn btn-primary">
              Установить
            </button>
            <button onClick={handleDismiss} className="btn btn-secondary">
              Позже
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstallPrompt;
