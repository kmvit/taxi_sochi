from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import User, DeviceToken


class UserSerializer(serializers.ModelSerializer):
    """Сериализатор для пользователя"""
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'phone', 'role']
        read_only_fields = ['id']


class UserRegistrationSerializer(serializers.ModelSerializer):
    """Сериализатор для регистрации пользователя"""
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'password2', 'first_name', 'last_name', 'phone', 'role']
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Пароли не совпадают"})
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('password2')
        user = User.objects.create_user(**validated_data)
        return user


class ChangePasswordSerializer(serializers.Serializer):
    """Сериализатор для смены пароля"""
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, validators=[validate_password])


class DeviceTokenSerializer(serializers.ModelSerializer):
    """Сериализатор для токенов устройств"""
    
    class Meta:
        model = DeviceToken
        fields = ['id', 'token', 'device_type', 'is_active', 'created_at']
        read_only_fields = ['id', 'is_active', 'created_at']
    
    def create(self, validated_data):
        # Автоматически связываем с текущим пользователем
        validated_data['user'] = self.context['request'].user
        
        # Если токен уже существует, активируем его снова
        token_str = validated_data.get('token')
        existing = DeviceToken.objects.filter(token=token_str).first()
        
        if existing:
            existing.user = validated_data['user']
            existing.device_type = validated_data.get('device_type', existing.device_type)
            existing.is_active = True
            existing.save()
            return existing
        
        return super().create(validated_data)
