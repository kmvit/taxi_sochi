from rest_framework import serializers
from .models import Zone, Pricing
from apps.cars.serializers import CarClassSerializer


class ZoneSerializer(serializers.ModelSerializer):
    """Сериализатор для зоны"""
    
    class Meta:
        model = Zone
        fields = ['id', 'name', 'description', 'order', 'is_active']
        read_only_fields = ['id']


class PricingSerializer(serializers.ModelSerializer):
    """Сериализатор для прайса"""
    zone_from_data = ZoneSerializer(source='zone_from', read_only=True)
    zone_to_data = ZoneSerializer(source='zone_to', read_only=True)
    car_class_data = CarClassSerializer(source='car_class', read_only=True)
    
    class Meta:
        model = Pricing
        fields = [
            'id', 'zone_from', 'zone_from_data', 'zone_to', 'zone_to_data',
            'car_class', 'car_class_data', 'price_client', 'price_driver',
            'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class GetPriceSerializer(serializers.Serializer):
    """Сериализатор для запроса цены"""
    zone_from = serializers.IntegerField()
    zone_to = serializers.IntegerField()
    car_class = serializers.IntegerField()
