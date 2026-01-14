import api from './api';

/**
 * Получить публичный VAPID ключ с сервера
 */
const getVapidPublicKey = async () => {
  try {
    const response = await api.get('/users/vapid-public-key/');
    return response.data.publicKey;
  } catch (error) {
    console.warn('VAPID key not available - notifications will not work:', error.message);
    return null;
  }
};

/**
 * Преобразовать base64 строку в Uint8Array
 */
const urlBase64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

/**
 * Запросить разрешение на уведомления
 */
export const requestNotificationPermission = async () => {
  try {
    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      console.log('Notification permission granted');
      return true;
    } else {
      console.log('Notification permission denied');
      return false;
    }
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
};

/**
 * Подписаться на push-уведомления
 */
export const subscribeToPush = async () => {
  try {
    if (!('serviceWorker' in navigator)) {
      console.warn('[Notifications] Service Worker not supported');
      return null;
    }

    console.log('[Notifications] Waiting for service worker to be ready...');
    // Ждем регистрации service worker с таймаутом
    const registration = await Promise.race([
      navigator.serviceWorker.ready,
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Service worker timeout')), 10000)
      )
    ]);
    console.log('[Notifications] Service worker is ready');

    // Получаем VAPID ключ с сервера
    console.log('[Notifications] Fetching VAPID public key...');
    const vapidPublicKey = await getVapidPublicKey();
    
    if (!vapidPublicKey) {
      console.error('[Notifications] Failed to get VAPID public key');
      return null;
    }
    console.log('[Notifications] VAPID key received');

    // Подписываемся на push
    console.log('[Notifications] Creating push subscription...');
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
    });

    console.log('[Notifications] Push subscription created successfully');
    return subscription;
  } catch (error) {
    console.error('[Notifications] Error subscribing to push:', error);
    return null;
  }
};

/**
 * Зарегистрировать подписку на backend
 */
export const registerSubscription = async (subscription) => {
  try {
    // Преобразуем подписку в JSON
    const subscriptionJson = subscription.toJSON();
    
    // Отправляем на backend как строку
    const response = await api.post('/users/device-token/register/', {
      token: JSON.stringify(subscriptionJson),
      device_type: 'web',
    });

    console.log('Subscription registered successfully');
    return response.data;
  } catch (error) {
    console.error('Error registering subscription:', error);
    throw error;
  }
};

/**
 * Удалить подписку
 */
export const unregisterSubscription = async (subscription) => {
  try {
    if (!subscription) {
      return { success: false, message: 'No subscription found' };
    }

    // Удаляем на backend
    const subscriptionJson = subscription.toJSON();
    await api.post('/users/device-token/unregister/', {
      token: JSON.stringify(subscriptionJson),
    });

    // Отписываемся от push
    await subscription.unsubscribe();

    console.log('Subscription unregistered successfully');
    return { success: true };
  } catch (error) {
    console.error('Error unregistering subscription:', error);
    return { success: false, message: error.message };
  }
};

/**
 * Инициализация уведомлений (запрос разрешения + подписка)
 */
export const initializeNotifications = async () => {
  try {
    console.log('[Notifications] Starting initialization...');
    
    // Проверяем поддержку
    if (!('Notification' in window)) {
      console.warn('[Notifications] Browser does not support notifications');
      return { success: false, message: 'Notifications not supported' };
    }

    if (!('serviceWorker' in navigator)) {
      console.warn('[Notifications] Browser does not support service workers');
      return { success: false, message: 'Service workers not supported' };
    }

    if (!('PushManager' in window)) {
      console.warn('[Notifications] Browser does not support push notifications');
      return { success: false, message: 'Push not supported' };
    }

    console.log('[Notifications] Current permission:', Notification.permission);

    // Запрашиваем разрешение
    const permissionGranted = await requestNotificationPermission();
    
    if (!permissionGranted) {
      console.log('[Notifications] Permission not granted');
      return { success: false, message: 'Permission denied' };
    }

    console.log('[Notifications] Permission granted, subscribing to push...');

    // Подписываемся на push
    const subscription = await subscribeToPush();
    
    if (!subscription) {
      console.warn('[Notifications] Failed to subscribe to push - VAPID keys may not be configured');
      return { success: false, message: 'Failed to subscribe' };
    }

    console.log('[Notifications] Registering subscription with backend...');
    // Регистрируем на backend
    await registerSubscription(subscription);

    // Сохраняем подписку в localStorage для отладки
    localStorage.setItem('push_subscription', JSON.stringify(subscription.toJSON()));

    console.log('[Notifications] Initialization complete!');
    return { success: true, subscription };
  } catch (error) {
    console.error('[Notifications] Error during initialization:', error);
    // Не бросаем ошибку дальше - просто логируем
    return { success: false, message: error.message };
  }
};

/**
 * Очистка уведомлений (отписка при выходе)
 */
export const cleanupNotifications = async () => {
  try {
    if (!('serviceWorker' in navigator)) {
      return { success: true };
    }

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      await unregisterSubscription(subscription);
      localStorage.removeItem('push_subscription');
    }

    return { success: true };
  } catch (error) {
    console.error('Error cleaning up notifications:', error);
    return { success: false, message: error.message };
  }
};

/**
 * Проверить статус разрешений
 */
export const getNotificationStatus = () => {
  if (!('Notification' in window)) {
    return 'not-supported';
  }

  return Notification.permission;
};

/**
 * Получить текущую подписку
 */
export const getCurrentSubscription = async () => {
  try {
    if (!('serviceWorker' in navigator)) {
      return null;
    }

    const registration = await navigator.serviceWorker.ready;
    return await registration.pushManager.getSubscription();
  } catch (error) {
    console.error('Error getting subscription:', error);
    return null;
  }
};
