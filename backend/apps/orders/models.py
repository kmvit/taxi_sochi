from django.db import models
from django.core.exceptions import ValidationError
from django.utils import timezone
from datetime import timedelta
from apps.users.models import User
from apps.drivers.models import Driver
from apps.cars.models import CarClass
from apps.pricing.models import Zone


class Order(models.Model):
    """
    Заказ на трансфер
    """
    STATUS_CHOICES = [
        ('pending', 'Ожидает водителя'),
        ('taken', 'Взят водителем'),
        ('in_progress', 'В пути'),
        ('completed', 'Выполнен'),
        ('cancelled', 'Отменен'),
    ]
    
    DIRECTION_CHOICES = [
        ('oneway', 'Только туда'),
        ('roundtrip', 'Туда и обратно'),
    ]
    
    # Основная информация
    customer = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='orders',
        verbose_name='Заказчик'
    )
    driver = models.ForeignKey(
        Driver,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='orders',
        verbose_name='Водитель'
    )
    
    # Пассажиры
    passenger_name = models.CharField(
        max_length=200,
        verbose_name='ФИО пассажира'
    )
    passenger_phone = models.CharField(
        max_length=20,
        verbose_name='Телефон пассажира'
    )
    passenger_count = models.IntegerField(
        default=1,
        verbose_name='Количество пассажиров'
    )
    
    # Маршрут
    zone_from = models.ForeignKey(
        Zone,
        on_delete=models.PROTECT,
        related_name='orders_from',
        verbose_name='Откуда'
    )
    zone_to = models.ForeignKey(
        Zone,
        on_delete=models.PROTECT,
        related_name='orders_to',
        verbose_name='Куда'
    )
    address_from = models.TextField(
        blank=True,
        verbose_name='Адрес откуда (детали)'
    )
    address_to = models.TextField(
        blank=True,
        verbose_name='Адрес куда (детали)'
    )
    
    # Время и направление
    pickup_time = models.DateTimeField(
        verbose_name='Время подачи'
    )
    direction = models.CharField(
        max_length=20,
        choices=DIRECTION_CHOICES,
        default='oneway',
        verbose_name='Направление'
    )
    
    # Класс авто
    car_class = models.ForeignKey(
        CarClass,
        on_delete=models.PROTECT,
        related_name='orders',
        verbose_name='Класс автомобиля'
    )
    
    # Дополнительная информация
    flight_number = models.CharField(
        max_length=50,
        blank=True,
        verbose_name='Номер рейса'
    )
    comment = models.TextField(
        blank=True,
        verbose_name='Комментарий'
    )
    
    # Цены
    price_client = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name='Цена для клиента'
    )
    price_driver = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        blank=True,
        null=True,
        verbose_name='Цена для водителя'
    )
    
    # Статус
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending',
        verbose_name='Статус'
    )
    
    # Оплата
    is_paid = models.BooleanField(
        default=False,
        verbose_name='Оплачен'
    )
    payment_method = models.CharField(
        max_length=50,
        blank=True,
        verbose_name='Способ оплаты'
    )
    
    # Временные метки
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Создан'
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name='Обновлен'
    )
    taken_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Взят водителем'
    )
    completed_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Выполнен'
    )
    
    class Meta:
        verbose_name = 'Заказ'
        verbose_name_plural = 'Заказы'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Заказ #{self.id} - {self.zone_from} → {self.zone_to} ({self.pickup_time.strftime('%d.%m.%Y %H:%M')})"
    
    def clean(self):
        # Валидация: минимум за час до подачи
        if self.pickup_time:
            min_time = timezone.now() + timedelta(hours=1)
            if self.pickup_time < min_time:
                raise ValidationError({
                    'pickup_time': 'Время подачи должно быть минимум через 1 час от текущего времени'
                })
    
    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)
