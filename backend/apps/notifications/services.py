import logging
from typing import List
from django.conf import settings
from pywebpush import webpush, WebPushException
from apps.users.models import User
from apps.drivers.models import Driver
from .models import NotificationLog

logger = logging.getLogger(__name__)


def send_web_push(subscription_info: dict, title: str, body: str, data: dict = None) -> bool:
    """
    Отправка Web Push уведомления
    
    Args:
        subscription_info: Информация о подписке (endpoint, keys)
        title: Заголовок уведомления
        body: Текст уведомления
        data: Дополнительные данные
    
    Returns:
        True если отправлено успешно
    """
    try:
        import json
        payload = {
            'title': title,
            'body': body,
            'data': data or {}
        }
        
        vapid_private_key = getattr(settings, 'VAPID_PRIVATE_KEY', None)
        vapid_claims = {
            "sub": getattr(settings, 'VAPID_ADMIN_EMAIL', 'mailto:admin@example.com')
        }
        
        if not vapid_private_key:
            logger.warning("VAPID_PRIVATE_KEY not configured")
            return False
        
        logger.info(f"Sending push notification: {title}")
        logger.debug(f"Payload: {json.dumps(payload)}")
        logger.debug(f"Subscription endpoint: {subscription_info.get('endpoint', 'N/A')[:50]}...")
        
        webpush(
            subscription_info=subscription_info,
            data=json.dumps(payload),
            vapid_private_key=vapid_private_key,
            vapid_claims=vapid_claims
        )
        
        logger.info(f"Push notification sent successfully: {title}")
        return True
        
    except WebPushException as e:
        logger.error(f"Web Push error: {e}")
        return False
    except Exception as e:
        logger.error(f"Error sending web push: {e}", exc_info=True)
        return False


def get_user_subscriptions(user: User) -> List[dict]:
    """Получить все активные подписки пользователя"""
    from apps.users.models import DeviceToken
    
    tokens = DeviceToken.objects.filter(
        user=user,
        is_active=True
    )
    
    subscriptions = []
    for token in tokens:
        try:
            import json
            # Токен хранится как JSON строка с endpoint и ключами
            subscription = json.loads(token.token)
            subscriptions.append(subscription)
        except:
            logger.warning(f"Invalid subscription format for token {token.id}")
    
    return subscriptions


def remove_invalid_subscription(token_string: str):
    """Удалить невалидную подписку из БД"""
    from apps.users.models import DeviceToken
    
    try:
        DeviceToken.objects.filter(token=token_string).update(is_active=False)
        logger.info(f"Deactivated invalid subscription")
    except Exception as e:
        logger.error(f"Error deactivating subscription: {e}")


def send_notification_to_user(
    user: User,
    notification_type: str,
    title: str,
    body: str,
    data: dict = None
) -> bool:
    """
    Отправить уведомление конкретному пользователю
    
    Args:
        user: Пользователь-получатель
        notification_type: Тип уведомления
        title: Заголовок
        body: Текст
        data: Дополнительные данные
    
    Returns:
        True если отправлено успешно хотя бы одному устройству
    """
    logger.info(f"[NOTIFY] Sending notification to user {user.username} (id={user.id})")
    
    # Создаем лог
    log = NotificationLog.objects.create(
        recipient=user,
        notification_type=notification_type,
        title=title,
        body=body,
        data=data or {}
    )
    
    # Получаем подписки
    subscriptions = get_user_subscriptions(user)
    
    logger.info(f"[NOTIFY] Found {len(subscriptions)} subscriptions for user {user.username}")
    
    if not subscriptions:
        log.error_message = "No active subscriptions found"
        log.save()
        logger.warning(f"[NOTIFY] No subscriptions for user {user.username}")
        return False
    
    # Отправляем всем подпискам
    success_count = 0
    for idx, subscription in enumerate(subscriptions):
        logger.info(f"[NOTIFY] Attempting to send to subscription {idx+1}/{len(subscriptions)}")
        if send_web_push(subscription, title, body, data):
            success_count += 1
        else:
            # Деактивируем невалидную подписку
            import json
            remove_invalid_subscription(json.dumps(subscription))
    
    # Обновляем лог
    if success_count > 0:
        log.is_sent = True
        log.save()
        logger.info(f"[NOTIFY] Successfully sent to {success_count}/{len(subscriptions)} subscriptions for {user.username}")
    else:
        log.error_message = f"Failed to send to all subscriptions"
        log.save()
        logger.error(f"[NOTIFY] Failed to send to all subscriptions for {user.username}")
    
    return success_count > 0


def send_to_drivers_by_car_class(
    car_class_id: int,
    notification_type: str,
    title: str,
    body: str,
    data: dict = None
) -> int:
    """
    Отправить уведомление водителям с определенной категорией авто
    
    Args:
        car_class_id: ID класса автомобиля
        notification_type: Тип уведомления
        title: Заголовок
        body: Текст
        data: Дополнительные данные
    
    Returns:
        Количество успешно отправленных уведомлений
    """
    # Находим водителей с нужной категорией авто
    drivers = Driver.objects.filter(
        is_active=True,
        cars__car_class_id=car_class_id,
        cars__is_active=True
    ).distinct()
    
    logger.info(f"[NOTIFY] Found {drivers.count()} drivers with car_class_id={car_class_id}")
    for driver in drivers:
        logger.info(f"[NOTIFY] Driver: {driver.user.username} (user_id={driver.user.id})")
    
    sent_count = 0
    for driver in drivers:
        logger.info(f"[NOTIFY] Sending notification to driver {driver.user.username}")
        if send_notification_to_user(driver.user, notification_type, title, body, data):
            sent_count += 1
            logger.info(f"[NOTIFY] Successfully sent to {driver.user.username}")
        else:
            logger.warning(f"[NOTIFY] Failed to send to {driver.user.username}")
    
    logger.info(f"[NOTIFY] Sent notifications to {sent_count}/{drivers.count()} drivers with car_class_id={car_class_id}")
    return sent_count


def send_to_admins(
    notification_type: str,
    title: str,
    body: str,
    data: dict = None
) -> int:
    """
    Отправить уведомление всем администраторам
    
    Args:
        notification_type: Тип уведомления
        title: Заголовок
        body: Текст
        data: Дополнительные данные
    
    Returns:
        Количество успешно отправленных уведомлений
    """
    admins = User.objects.filter(role='admin', is_active=True)
    
    sent_count = 0
    for admin in admins:
        if send_notification_to_user(admin, notification_type, title, body, data):
            sent_count += 1
    
    logger.info(f"Sent notifications to {sent_count} admins")
    return sent_count


def send_order_notification_to_drivers(order):
    """Отправить уведомление о новом/обновленном заказе водителям"""
    logger.info(f"Sending order notification for order #{order.id} to drivers with car_class={order.car_class.name}")
    
    title = "Новый заказ"
    body = f"Маршрут: {order.zone_from.name} → {order.zone_to.name}, Класс: {order.car_class.name}"
    data = {
        'type': 'new_order',
        'order_id': str(order.id),
        'car_class_id': str(order.car_class.id),
    }
    
    sent_count = send_to_drivers_by_car_class(
        order.car_class.id,
        'new_order',
        title,
        body,
        data
    )
    
    logger.info(f"Order notification sent to {sent_count} drivers")
    return sent_count


def send_order_available_again_to_drivers(order):
    """Отправить уведомление о возврате заказа в ленту"""
    title = "Заказ снова доступен"
    body = f"Заказ #{order.id} вернулся в ленту: {order.zone_from.name} → {order.zone_to.name}"
    data = {
        'type': 'order_cancelled',
        'order_id': str(order.id),
        'car_class_id': str(order.car_class.id),
    }
    
    return send_to_drivers_by_car_class(
        order.car_class.id,
        'order_cancelled',
        title,
        body,
        data
    )


def send_order_created_to_admins(order):
    """Уведомление админу о создании заказа"""
    title = "Новый заказ создан"
    body = f"Заказ #{order.id} от {order.customer.username}"
    data = {
        'type': 'order_created',
        'order_id': str(order.id),
    }
    
    return send_to_admins('new_order', title, body, data)


def send_order_cancelled_to_admins(order):
    """Уведомление админу об отмене заказа"""
    title = "Заказ отменен"
    body = f"Водитель отменил заказ #{order.id}"
    data = {
        'type': 'order_cancelled',
        'order_id': str(order.id),
    }
    
    return send_to_admins('order_cancelled', title, body, data)


def send_order_completed_to_admins(order):
    """Уведомление админу о завершении заказа"""
    title = "Заказ завершен"
    body = f"Заказ #{order.id} успешно выполнен"
    data = {
        'type': 'order_completed',
        'order_id': str(order.id),
    }
    
    return send_to_admins('order_completed', title, body, data)
