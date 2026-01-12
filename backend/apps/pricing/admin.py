from django.contrib import admin
from .models import Zone, Pricing


@admin.register(Zone)
class ZoneAdmin(admin.ModelAdmin):
    list_display = ['name', 'order', 'is_active']
    list_filter = ['is_active']
    search_fields = ['name']
    list_editable = ['order', 'is_active']


@admin.register(Pricing)
class PricingAdmin(admin.ModelAdmin):
    list_display = ['zone_from', 'zone_to', 'car_class', 'price_client', 'price_driver', 'is_active']
    list_filter = ['car_class', 'is_active', 'zone_from', 'zone_to']
    search_fields = ['zone_from__name', 'zone_to__name', 'car_class__name']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Маршрут', {
            'fields': ('zone_from', 'zone_to', 'car_class')
        }),
        ('Цены', {
            'fields': ('price_client', 'price_driver')
        }),
        ('Статус', {
            'fields': ('is_active',)
        }),
        ('Системная информация', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
