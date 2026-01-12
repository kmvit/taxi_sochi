from django.db import models
from apps.drivers.models import Driver


class CarClass(models.Model):
    """
    Класс автомобиля (Стандарт, Комфорт, Минивэн и т.д.)
    """
    name = models.CharField(
        max_length=100,
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
        verbose_name='Активен'
    )
    
    class Meta:
        verbose_name = 'Класс автомобиля'
        verbose_name_plural = 'Классы автомобилей'
        ordering = ['order', 'name']
    
    def __str__(self):
        return self.name


class Car(models.Model):
    """
    Автомобиль
    """
    driver = models.ForeignKey(
        Driver,
        on_delete=models.CASCADE,
        related_name='cars',
        verbose_name='Водитель'
    )
    car_class = models.ForeignKey(
        CarClass,
        on_delete=models.PROTECT,
        related_name='cars',
        verbose_name='Класс автомобиля'
    )
    brand = models.CharField(
        max_length=100,
        verbose_name='Марка'
    )
    model = models.CharField(
        max_length=100,
        verbose_name='Модель'
    )
    color = models.CharField(
        max_length=50,
        verbose_name='Цвет'
    )
    license_plate = models.CharField(
        max_length=20,
        unique=True,
        verbose_name='Госномер'
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
        verbose_name = 'Автомобиль'
        verbose_name_plural = 'Автомобили'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.brand} {self.model} ({self.license_plate})"
    
    @property
    def full_name(self):
        return f"{self.color} {self.brand} {self.model}"
