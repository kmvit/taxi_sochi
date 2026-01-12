from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Car, CarClass
from .serializers import (
    CarSerializer, 
    CarCreateUpdateSerializer,
    CarClassSerializer
)


class IsAdminOrDriverOwner(permissions.BasePermission):
    """
    Админ может все, водитель может только свои авто
    """
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        if request.user.role == 'admin':
            return True
        
        if request.user.role == 'driver':
            # Водители могут просматривать и создавать авто
            if request.method in ['GET', 'POST']:
                return True
        
        return False
    
    def has_object_permission(self, request, view, obj):
        # Админ может все
        if request.user.role == 'admin':
            return True
        
        # Водитель может изменять только свои авто
        if request.user.role == 'driver':
            return obj.driver.user == request.user
        
        return False


class CarClassViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet для классов автомобилей (только чтение)"""
    queryset = CarClass.objects.filter(is_active=True)
    serializer_class = CarClassSerializer
    permission_classes = [permissions.IsAuthenticated]


class CarViewSet(viewsets.ModelViewSet):
    """ViewSet для управления автомобилями"""
    queryset = Car.objects.all()
    permission_classes = [IsAdminOrDriverOwner]
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return CarCreateUpdateSerializer
        return CarSerializer
    
    def get_queryset(self):
        queryset = Car.objects.all()
        
        # Водители видят только свои авто
        if self.request.user.role == 'driver':
            try:
                queryset = queryset.filter(driver__user=self.request.user)
            except:
                queryset = queryset.none()
        
        return queryset
    
    @action(detail=False, methods=['get'])
    def my_cars(self, request):
        """Получить автомобили текущего водителя"""
        if request.user.role != 'driver':
            return Response(
                {"detail": "Только для водителей"}, 
                status=403
            )
        
        cars = Car.objects.filter(driver__user=request.user)
        serializer = self.get_serializer(cars, many=True)
        return Response(serializer.data)
