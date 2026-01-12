import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import '../styles/InstallPrompt.css';

const InstallPrompt = () => {
  const { user } = useAuth();
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Проверяем, установлено ли приложение
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Проверяем, видел ли пользователь промпт ранее
    const hasSeenPrompt = localStorage.getItem('pwa-install-prompt-seen');
    if (hasSeenPrompt) {
      return;
    }

    // Слушаем событие beforeinstallprompt
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Показываем промпт только если пользователь авторизован
      if (user) {
        // Небольшая задержка для лучшего UX
        setTimeout(() => {
          setShowPrompt(true);
        }, 1000);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [user]);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      return;
    }

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
    setShowPrompt(false);
    localStorage.setItem('pwa-install-prompt-seen', 'true');
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-install-prompt-seen', 'true');
  };

  // Не показываем, если приложение уже установлено или нет промпта
  if (isInstalled || !showPrompt || !deferredPrompt || !user) {
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
