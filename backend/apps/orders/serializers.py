from rest_framework import serializers
from django.utils import timezone
from datetime import timedelta
from .models import Order
from apps.users.serializers import UserSerializer
from apps.drivers.serializers import DriverSerializer
from apps.cars.serializers import CarClassSerializer
from apps.pricing.serializers import ZoneSerializer
from apps.pricing.models import Pricing


class OrderSerializer(serializers.ModelSerializer):
    """Сериализатор для заказа"""
    customer_data = UserSerializer(source='customer', read_only=True)
    driver_data = DriverSerializer(source='driver', read_only=True)
    zone_from_data = ZoneSerializer(source='zone_from', read_only=True)
    zone_to_data = ZoneSerializer(source='zone_to', read_only=True)
    car_class_data = CarClassSerializer(source='car_class', read_only=True)
    
    class Meta:
        model = Order
        fields = [
            'id', 'customer', 'customer_data', 'driver', 'driver_data',
            'passenger_name', 'passenger_phone', 'passenger_count',
            'zone_from', 'zone_from_data', 'zone_to', 'zone_to_data',
            'address_from', 'address_to', 'pickup_time', 'direction',
            'car_class', 'car_class_data', 'flight_number', 'comment',
            'price_client', 'price_driver', 'status', 'is_paid',
            'payment_method', 'created_at', 'updated_at',
            'taken_at', 'completed_at'
        ]
        read_only_fields = [
            'id', 'customer', 'created_at', 'updated_at',
            'taken_at', 'completed_at'
        ]


class OrderCreateSerializer(serializers.ModelSerializer):
    """Сериализатор для создания заказа"""
    
    class Meta:
        model = Order
        fields = [
            'passenger_name', 'passenger_phone', 'passenger_count',
            'zone_from', 'zone_to', 'address_from', 'address_to',
            'pickup_time', 'direction', 'car_class', 'flight_number',
            'comment', 'payment_method'
        ]
    
    def validate_pickup_time(self, value):
        """Валидация времени подачи (минимум +1 час)"""
        min_time = timezone.now() + timedelta(hours=1)
        if value < min_time:
            raise serializers.ValidationError(
                'Время подачи должно быть минимум через 1 час от текущего времени'
            )
        return value
    
    def create(self, validated_data):
        # Получаем цены из прайс-листа
        try:
            pricing = Pricing.objects.get(
                zone_from=validated_data['zone_from'],
                zone_to=validated_data['zone_to'],
                car_class=validated_data['car_class'],
                is_active=True
            )
            
            validated_data['price_client'] = pricing.price_client
            validated_data['price_driver'] = pricing.price_driver
            
        except Pricing.DoesNotExist:
            raise serializers.ValidationError(
                "Цена для данного маршрута не найдена"
            )
        
        # Устанавливаем заказчика
        validated_data['customer'] = self.context['request'].user
        
        # Для физических лиц требуется оплата
        if self.context['request'].user.role == 'customer':
            validated_data['is_paid'] = False  # В реальности проверяем оплату
        
        order = Order.objects.create(**validated_data)
        return order


class OrderUpdateStatusSerializer(serializers.Serializer):
    """Сериализатор для изменения статуса заказа"""
    status = serializers.ChoiceField(choices=Order.STATUS_CHOICES)
