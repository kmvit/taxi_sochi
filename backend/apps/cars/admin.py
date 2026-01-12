from django.contrib import admin
from .models import Car, CarClass


@admin.register(CarClass)
class CarClassAdmin(admin.ModelAdmin):
    list_display = ['name', 'order', 'is_active']
    list_filter = ['is_active']
    search_fields = ['name']
    list_editable = ['order', 'is_active']


@admin.register(Car)
class CarAdmin(admin.ModelAdmin):
    list_display = ['full_name', 'license_plate', 'car_class', 'driver', 'is_active', 'created_at']
    list_filter = ['car_class', 'is_active', 'created_at']
    search_fields = ['brand', 'model', 'color', 'license_plate', 'driver__last_name']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Основная информация', {
            'fields': ('driver', 'car_class', 'brand', 'model', 'color', 'license_plate')
        }),
        ('Статус', {
            'fields': ('is_active',)
        }),
        ('Системная информация', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
