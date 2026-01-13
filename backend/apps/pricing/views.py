from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Zone, Pricing
from .serializers import (
    ZoneSerializer, 
    PricingSerializer,
    GetPriceSerializer
)


class IsAdminOrReadOnly(permissions.BasePermission):
    """Админ может изменять, остальные только читать"""
    
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return request.user.is_authenticated
        return request.user.is_authenticated and request.user.role == 'admin'


class ZoneViewSet(viewsets.ModelViewSet):
    """ViewSet для зон"""
    queryset = Zone.objects.filter(is_active=True)
    serializer_class = ZoneSerializer
    permission_classes = [IsAdminOrReadOnly]


class PricingViewSet(viewsets.ModelViewSet):
    """ViewSet для прайс-листа"""
    queryset = Pricing.objects.filter(is_active=True)
    serializer_class = PricingSerializer
    permission_classes = [IsAdminOrReadOnly]
    
    def get_permissions(self):
        """
        Переопределяем права доступа для action get_price
        """
        if self.action == 'get_price':
            return [permissions.IsAuthenticated()]
        return super().get_permissions()
    
    @action(detail=False, methods=['post'], url_path='get_price')
    def get_price(self, request):
        """
        Получить цену для маршрута и класса авто
        Доступно всем аутентифицированным пользователям
        """
        serializer = GetPriceSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            pricing = Pricing.objects.get(
                zone_from_id=serializer.validated_data['zone_from'],
                zone_to_id=serializer.validated_data['zone_to'],
                car_class_id=serializer.validated_data['car_class'],
                is_active=True
            )
            
            response_data = {
                'price_client': pricing.price_client,
                'zone_from': ZoneSerializer(pricing.zone_from).data,
                'zone_to': ZoneSerializer(pricing.zone_to).data,
            }
            
            # Показываем цену водителя только водителям и админам
            if request.user.role in ['driver', 'admin']:
                response_data['price_driver'] = pricing.price_driver
            
            return Response(response_data)
        
        except Pricing.DoesNotExist:
            return Response(
                {"detail": "Цена для данного маршрута не найдена"},
                status=status.HTTP_404_NOT_FOUND
            )
