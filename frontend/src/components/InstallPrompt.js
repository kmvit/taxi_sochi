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
    const ios = isIOSDevice();
    const standalone = isRunningStandalone();
    
    // Проверка URL параметра для принудительного показа (для тестирования)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('showInstall') === 'true') {
      localStorage.removeItem(SEEN_KEY);
      console.log('[PWA] Forced show via URL parameter');
    }
    
    console.log('[PWA] InstallPrompt mounted');
    console.log('[PWA] iOS device:', ios);
    console.log('[PWA] Running standalone:', standalone);
    console.log('[PWA] HTTPS:', window.location.protocol === 'https:');
    console.log('[PWA] Service Worker support:', 'serviceWorker' in navigator);
    
    setIsIOS(ios);
    setInstalled(standalone);

    const onAppInstalled = () => {
      console.log('[PWA] App installed event fired');
      setInstalled(true);
      setShowPrompt(false);
      localStorage.setItem(SEEN_KEY, 'true');
    };

    const onBeforeInstallPrompt = (e) => {
      console.log('[PWA] beforeinstallprompt event fired', e);
      // Chrome/Android: даём показать наш UI вместо мини-инфобара
      e.preventDefault();
      setDeferredPrompt(e);
      // Если событие пришло, значит это не чистый iOS Safari
      // (iOS Safari не поддерживает beforeinstallprompt)
      // Обновляем флаг iOS
      if (ios && e.platforms && e.platforms.length > 0) {
        console.log('[PWA] beforeinstallprompt on iOS-like device, treating as non-iOS for install');
        setIsIOS(false);
      }
    };

    window.addEventListener('appinstalled', onAppInstalled);
    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);

    return () => {
      window.removeEventListener('appinstalled', onAppInstalled);
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    };
  }, []);

  // 2) Показываем подсказку после входа или когда приходит beforeinstallprompt
  useEffect(() => {
    console.log('[PWA] Check show prompt:', { 
      user: !!user, 
      installed, 
      seen: localStorage.getItem(SEEN_KEY),
      hasDeferredPrompt: !!deferredPrompt 
    });
    
    if (!user || installed) return;
    
    // Если есть deferredPrompt (событие beforeinstallprompt), показываем окно
    // даже если оно уже показывалось - браузер готов к установке!
    if (deferredPrompt) {
      console.log('[PWA] beforeinstallprompt available, showing prompt');
      const t = setTimeout(() => {
        setShowPrompt(true);
      }, 500);
      return () => clearTimeout(t);
    }
    
    // Иначе показываем только если еще не показывали
    if (localStorage.getItem(SEEN_KEY)) return;

    console.log('[PWA] Will show prompt in 1.5s');
    const t = setTimeout(() => {
      console.log('[PWA] Showing install prompt');
      setShowPrompt(true);
    }, 1500);
    return () => clearTimeout(t);
  }, [user, installed, deferredPrompt]);

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
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      console.log('User choice:', choiceResult);
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
    } catch (error) {
      console.error('Error during installation:', error);
    } finally {
      setDeferredPrompt(null);
      dismiss();
    }
  };

  // Для отладки показываем состояние
  useEffect(() => {
    if (showPrompt) {
      console.log('[PWA] Prompt should be visible now');
      console.log('[PWA] deferredPrompt available:', !!deferredPrompt);
      console.log('[PWA] isIOS:', isIOS);
    }
  }, [showPrompt, deferredPrompt, isIOS]);

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
              <button onClick={install} className="btn btn-primary">
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
