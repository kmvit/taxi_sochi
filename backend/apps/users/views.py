from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import update_session_auth_hash
from .models import User
from .serializers import (
    UserSerializer, 
    UserRegistrationSerializer,
    ChangePasswordSerializer
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
