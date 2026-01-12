from django.contrib import admin
from .models import Order


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'passenger_name', 'zone_from', 'zone_to', 
        'pickup_time', 'car_class', 'status', 'driver', 
        'price_client', 'is_paid', 'created_at'
    ]
    list_filter = ['status', 'car_class', 'is_paid', 'direction', 'created_at']
    search_fields = [
        'passenger_name', 'passenger_phone', 'flight_number',
        'customer__username', 'driver__last_name'
    ]
    readonly_fields = ['created_at', 'updated_at', 'taken_at', 'completed_at']
    date_hierarchy = 'pickup_time'
    
    fieldsets = (
        ('Заказчик', {
            'fields': ('customer', 'is_paid', 'payment_method')
        }),
        ('Пассажир', {
            'fields': ('passenger_name', 'passenger_phone', 'passenger_count')
        }),
        ('Маршрут', {
            'fields': (
                'zone_from', 'address_from', 'zone_to', 'address_to',
                'pickup_time', 'direction'
            )
        }),
        ('Автомобиль', {
            'fields': ('car_class', 'driver')
        }),
        ('Дополнительно', {
            'fields': ('flight_number', 'comment')
        }),
        ('Цены', {
            'fields': ('price_client', 'price_driver')
        }),
        ('Статус', {
            'fields': ('status',)
        }),
        ('Системная информация', {
            'fields': ('created_at', 'updated_at', 'taken_at', 'completed_at'),
            'classes': ('collapse',)
        }),
    )
