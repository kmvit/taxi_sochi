from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Driver
from .serializers import DriverSerializer, DriverCreateSerializer


class IsAdminOrReadOnly(permissions.BasePermission):
    """Только админ может создавать/изменять/удалять"""
    
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return request.user.is_authenticated
        return request.user.is_authenticated and request.user.role == 'admin'


class DriverViewSet(viewsets.ModelViewSet):
    """ViewSet для управления водителями"""
    queryset = Driver.objects.all()
    permission_classes = [IsAdminOrReadOnly]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return DriverCreateSerializer
        return DriverSerializer
    
    @action(detail=False, methods=['get'])
    def me(self, request):
        """Получить профиль текущего водителя"""
        try:
            driver = Driver.objects.get(user=request.user)
            serializer = self.get_serializer(driver)
            return Response(serializer.data)
        except Driver.DoesNotExist:
            return Response(
                {"detail": "Профиль водителя не найден"}, 
                status=404
            )
