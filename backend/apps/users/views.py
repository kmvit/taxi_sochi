from django.conf import settings
from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import update_session_auth_hash
from .models import User, DeviceToken
from .serializers import (
    UserSerializer, 
    UserRegistrationSerializer,
    ChangePasswordSerializer,
    DeviceTokenSerializer
)


class RegistrationView(generics.CreateAPIView):
    """Регистрация нового пользователя"""
    queryset = User.objects.all()
    permission_classes = [AllowAny]
    serializer_class = UserRegistrationSerializer


class ProfileView(generics.RetrieveUpdateAPIView):
    """Просмотр и редактирование профиля"""
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    
    def get_object(self):
        return self.request.user


class ChangePasswordView(generics.UpdateAPIView):
    """Смена пароля"""
    serializer_class = ChangePasswordSerializer
    permission_classes = [IsAuthenticated]
    
    def update(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user = request.user
        
        if not user.check_password(serializer.data.get("old_password")):
            return Response(
                {"old_password": "Неверный пароль"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user.set_password(serializer.data.get("new_password"))
        user.save()
        
        update_session_auth_hash(request, user)
        
        return Response(
            {"detail": "Пароль успешно изменен"}, 
            status=status.HTTP_200_OK
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def current_user(request):
    """Получить текущего пользователя"""
    serializer = UserSerializer(request.user)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def register_device_token(request):
    """Регистрация токена устройства для push-уведомлений"""
    serializer = DeviceTokenSerializer(data=request.data, context={'request': request})
    
    if serializer.is_valid():
        serializer.save()
        return Response(
            {"detail": "Токен успешно зарегистрирован", "token": serializer.data},
            status=status.HTTP_201_CREATED
        )
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def unregister_device_token(request):
    """Удаление токена устройства"""
    token = request.data.get('token')
    
    if not token:
        return Response(
            {"detail": "Требуется поле 'token'"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        device_token = DeviceToken.objects.get(token=token, user=request.user)
        device_token.is_active = False
        device_token.save()
        
        return Response(
            {"detail": "Токен успешно деактивирован"},
            status=status.HTTP_200_OK
        )
    except DeviceToken.DoesNotExist:
        return Response(
            {"detail": "Токен не найден"},
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['GET'])
@permission_classes([AllowAny])
def get_vapid_public_key(request):
    """Получить публичный VAPID ключ"""
    public_key = getattr(settings, 'VAPID_PUBLIC_KEY', '')
    
    if not public_key:
        return Response(
            {"detail": "VAPID ключ не настроен"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    
    return Response({"publicKey": public_key})
