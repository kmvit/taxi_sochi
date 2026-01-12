from rest_framework import serializers
from .models import Driver
from apps.users.serializers import UserSerializer


class DriverSerializer(serializers.ModelSerializer):
    """Сериализатор для водителя"""
    user_data = UserSerializer(source='user', read_only=True)
    full_name = serializers.CharField(read_only=True)
    
    class Meta:
        model = Driver
        fields = [
            'id', 'user', 'user_data', 'first_name', 'last_name', 
            'middle_name', 'phone', 'full_name', 'is_active', 
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class DriverCreateSerializer(serializers.ModelSerializer):
    """Сериализатор для создания водителя"""
    username = serializers.CharField(write_only=True)
    password = serializers.CharField(write_only=True)
    
    class Meta:
        model = Driver
        fields = [
            'username', 'password', 'first_name', 'last_name', 
            'middle_name', 'phone', 'is_active'
        ]
    
    def create(self, validated_data):
        from apps.users.models import User
        
        username = validated_data.pop('username')
        password = validated_data.pop('password')
        
        # Создаем пользователя
        user = User.objects.create_user(
            username=username,
            password=password,
            role='driver'
        )
        
        # Создаем профиль водителя
        driver = Driver.objects.create(user=user, **validated_data)
        return driver
