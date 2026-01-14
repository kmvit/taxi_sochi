from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from .models import Order
import logging

logger = logging.getLogger(__name__)


@receiver(post_save, sender=Order)
def order_notification_handler(sender, instance, created, **kwargs):
    """
    Обработчик сигнала для отправки уведомлений при изменении заказа
    """
    from apps.notifications.services import (
        send_order_notification_to_drivers,
        send_order_created_to_admins,
        send_order_completed_to_admins,
    )
    
    try:
        if created:
            # Новый заказ создан
            if instance.status == 'pending':
                # Уведомляем водителей с нужной категорией авто
                send_order_notification_to_drivers(instance)
                # Уведомляем администраторов
                send_order_created_to_admins(instance)
                logger.info(f"Notifications sent for new order #{instance.id}")
        
        else:
            # Заказ обновлен
            if instance.status == 'completed':
                # Заказ завершен - уведомляем админов
                send_order_completed_to_admins(instance)
                logger.info(f"Completion notification sent for order #{instance.id}")
    
    except Exception as e:
        logger.error(f"Error sending order notification: {e}")


# Для отслеживания отмены заказа водителем нам нужно знать предыдущее состояние
# Используем словарь для хранения предыдущих значений
_order_previous_state = {}


@receiver(pre_save, sender=Order)
def track_order_changes(sender, instance, **kwargs):
    """
    Отслеживание изменений заказа перед сохранением
    """
    if instance.pk:
        try:
            previous = Order.objects.get(pk=instance.pk)
            _order_previous_state[instance.pk] = {
                'status': previous.status,
                'driver_id': previous.driver_id if previous.driver else None,
            }
        except Order.DoesNotExist:
            pass


@receiver(post_save, sender=Order)
def order_cancellation_handler(sender, instance, created, **kwargs):
    """
    Обработчик отмены заказа водителем (возврат в pending)
    """
    if created:
        return
    
    from apps.notifications.services import (
        send_order_available_again_to_drivers,
        send_order_cancelled_to_admins,
    )
    
    try:
        previous = _order_previous_state.get(instance.pk, {})
        
        # Проверяем, был ли заказ отменен водителем
        # (был taken/in_progress, стал pending и водитель был убран)
        if (previous.get('status') in ['taken', 'in_progress'] and 
            instance.status == 'pending' and 
            previous.get('driver_id') is not None and
            instance.driver is None):
            
            # Заказ отменен водителем и вернулся в ленту
            send_order_available_again_to_drivers(instance)
            send_order_cancelled_to_admins(instance)
            logger.info(f"Cancellation notifications sent for order #{instance.id}")
        
        # Очищаем сохраненное состояние
        if instance.pk in _order_previous_state:
            del _order_previous_state[instance.pk]
    
    except Exception as e:
        logger.error(f"Error sending cancellation notification: {e}")
