from django.db import models
from apps.cars.models import CarClass


class Zone(models.Model):
    """
    Зона/точка в Сочи
    """
    name = models.CharField(
        max_length=200,
        unique=True,
        verbose_name='Название'
    )
    description = models.TextField(
        blank=True,
        verbose_name='Описание'
    )
    order = models.IntegerField(
        default=0,
        verbose_name='Порядок сортировки'
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name='Активна'
    )
    
    class Meta:
        verbose_name = 'Зона'
        verbose_name_plural = 'Зоны'
        ordering = ['order', 'name']
    
    def __str__(self):
        return self.name


class Pricing(models.Model):
    """
    Прайс-лист: цена от зоны до зоны для определенного класса
    """
    zone_from = models.ForeignKey(
        Zone,
        on_delete=models.CASCADE,
        related_name='prices_from',
        verbose_name='Откуда'
    )
    zone_to = models.ForeignKey(
        Zone,
        on_delete=models.CASCADE,
        related_name='prices_to',
        verbose_name='Куда'
    )
    car_class = models.ForeignKey(
        CarClass,
        on_delete=models.CASCADE,
        related_name='prices',
        verbose_name='Класс автомобиля'
    )
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
    is_active = models.BooleanField(
        default=True,
        verbose_name='Активна'
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Создана'
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name='Обновлена'
    )
    
    class Meta:
        verbose_name = 'Цена'
        verbose_name_plural = 'Цены'
        unique_together = ['zone_from', 'zone_to', 'car_class']
        ordering = ['zone_from', 'zone_to', 'car_class']
    
    def __str__(self):
        return f"{self.zone_from} → {self.zone_to} ({self.car_class}): {self.price_client}₽"
