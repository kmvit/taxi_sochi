from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """
    Модель пользователя с ролями: admin, driver, customer
    """
    ROLE_CHOICES = [
        ('admin', 'Администратор'),
        ('driver', 'Водитель'),
        ('customer', 'Заказчик'),
    ]
    
    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default='customer',
        verbose_name='Роль'
    )
    phone = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        verbose_name='Телефон'
    )
    
    class Meta:
        verbose_name = 'Пользователь'
        verbose_name_plural = 'Пользователи'
        
    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"


class DeviceToken(models.Model):
    """
    Токены устройств для push-уведомлений (FCM)
    """
    DEVICE_TYPES = [
        ('web', 'Web'),
        ('android', 'Android'),
        ('ios', 'iOS'),
    ]
    
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='device_tokens',
        verbose_name='Пользователь'
    )
    token = models.CharField(
        max_length=255,
        unique=True,
        verbose_name='FCM токен'
    )
    device_type = models.CharField(
        max_length=20,
        choices=DEVICE_TYPES,
        default='web',
        verbose_name='Тип устройства'
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name='Активен'
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Создан'
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name='Обновлен'
    )
    
    class Meta:
        verbose_name = 'Токен устройства'
        verbose_name_plural = 'Токены устройств'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.username} - {self.device_type} - {self.token[:20]}..."
