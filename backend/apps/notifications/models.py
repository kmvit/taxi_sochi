from django.db import models
from apps.users.models import User


class NotificationLog(models.Model):
    """
    Лог отправленных уведомлений
    """
    NOTIFICATION_TYPES = [
        ('new_order', 'Новый заказ'),
        ('order_cancelled', 'Заказ отменен'),
        ('order_updated', 'Заказ обновлен'),
        ('order_taken', 'Заказ взят'),
        ('order_completed', 'Заказ завершен'),
    ]
    
    recipient = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='notifications',
        verbose_name='Получатель'
    )
    notification_type = models.CharField(
        max_length=50,
        choices=NOTIFICATION_TYPES,
        verbose_name='Тип уведомления'
    )
    title = models.CharField(
        max_length=255,
        verbose_name='Заголовок'
    )
    body = models.TextField(
        verbose_name='Текст'
    )
    data = models.JSONField(
        default=dict,
        blank=True,
        verbose_name='Дополнительные данные'
    )
    is_sent = models.BooleanField(
        default=False,
        verbose_name='Отправлено'
    )
    error_message = models.TextField(
        blank=True,
        verbose_name='Сообщение об ошибке'
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Создано'
    )
    
    class Meta:
        verbose_name = 'Лог уведомлений'
        verbose_name_plural = 'Логи уведомлений'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.get_notification_type_display()} для {self.recipient.username}"
