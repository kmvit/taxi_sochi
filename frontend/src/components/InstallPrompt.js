import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import '../styles/InstallPrompt.css';

const SEEN_KEY = 'pwa-install-prompt-seen';

const isRunningStandalone = () => {
  // Android/Chrome
  if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
    return true;
  }
  // iOS Safari
  // eslint-disable-next-line no-undef
  return window.navigator && window.navigator.standalone === true;
};

const isIOSDevice = () => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
};

const InstallPrompt = () => {
  const { user } = useAuth();
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  // 1) Слушаем события установки
  useEffect(() => {
    setIsIOS(isIOSDevice());
    setInstalled(isRunningStandalone());

    const onAppInstalled = () => {
      setInstalled(true);
      setShowPrompt(false);
      localStorage.setItem(SEEN_KEY, 'true');
    };

    const onBeforeInstallPrompt = (e) => {
      // Chrome/Android: даём показать наш UI вместо мини-инфобара
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('appinstalled', onAppInstalled);
    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);

    return () => {
      window.removeEventListener('appinstalled', onAppInstalled);
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    };
  }, []);

  // 2) Показываем подсказку после входа (один раз)
  useEffect(() => {
    if (!user || installed) return;
    if (localStorage.getItem(SEEN_KEY)) return;

    const t = setTimeout(() => setShowPrompt(true), 1500);
    return () => clearTimeout(t);
  }, [user, installed]);

  const dismiss = () => {
    setShowPrompt(false);
    localStorage.setItem(SEEN_KEY, 'true');
  };

  const install = async () => {
    // iOS / или Android, где prompt ещё не доступен: показываем инструкцию
    if (!deferredPrompt) {
      if (isIOS) {
        return;
      }
      alert(
        'Если кнопки установки нет, откройте меню браузера и выберите "Установить приложение" / "Добавить на главный экран".'
      );
      dismiss();
      return;
    }

    try {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
    } finally {
      setDeferredPrompt(null);
      dismiss();
    }
  };

  if (!user || installed || !showPrompt) {
    return null;
  }

  return (
    <div className="install-prompt-overlay">
      <div className="install-prompt">
        <div className="install-prompt-content">
          <div className="install-prompt-icon">📱</div>
          <h3>Установить на телефон</h3>

          {isIOS ? (
            <p>
              На iPhone: нажмите <strong>«Поделиться»</strong>, затем{' '}
              <strong>«На экран Домой»</strong>.
            </p>
          ) : (
            <p>
              Можно установить как приложение. Если кнопка «Установить» неактивна — откройте меню браузера и
              выберите <strong>«Установить приложение»</strong>.
            </p>
          )}

          <div className="install-prompt-actions">
            {!isIOS && (
              <button onClick={install} className="btn btn-primary" disabled={!deferredPrompt}>
                Установить
              </button>
            )}
            <button onClick={dismiss} className="btn btn-secondary">
              Закрыть
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstallPrompt;
