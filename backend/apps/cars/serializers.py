from rest_framework import serializers
from .models import Car, CarClass
from apps.drivers.serializers import DriverSerializer


class CarClassSerializer(serializers.ModelSerializer):
    """Сериализатор для класса автомобиля"""
    
    class Meta:
        model = CarClass
        fields = ['id', 'name', 'description', 'order', 'is_active']
        read_only_fields = ['id']


class CarSerializer(serializers.ModelSerializer):
    """Сериализатор для автомобиля"""
    driver_data = DriverSerializer(source='driver', read_only=True)
    car_class_data = CarClassSerializer(source='car_class', read_only=True)
    full_name = serializers.CharField(read_only=True)
    
    class Meta:
        model = Car
        fields = [
            'id', 'driver', 'driver_data', 'car_class', 'car_class_data',
            'brand', 'model', 'color', 'license_plate', 'full_name',
            'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class CarCreateUpdateSerializer(serializers.ModelSerializer):
    """Сериализатор для создания/обновления автомобиля"""
    
    class Meta:
        model = Car
        fields = [
            'id', 'driver', 'car_class', 'brand', 'model', 
            'color', 'license_plate', 'is_active'
        ]
        read_only_fields = ['id']
