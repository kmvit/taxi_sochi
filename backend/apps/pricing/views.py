from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.conf import settings
from django.db.models import Q
import requests
from shapely.geometry import Point, shape
from .models import Zone, Pricing
from apps.orders.models import Order
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
    
    def get_queryset(self):
        """Админы видят все зоны, остальные только активные"""
        if self.request.user.is_authenticated and self.request.user.role == 'admin':
            return Zone.objects.all()
        return Zone.objects.filter(is_active=True)
    
    def destroy(self, request, *args, **kwargs):
        """
        Удаление зоны с проверкой использования в заказах и ценах
        """
        instance = self.get_object()
        
        # Проверяем, используется ли зона в заказах
        orders_count = Order.objects.filter(
            Q(zone_from=instance) | Q(zone_to=instance)
        ).count()
        
        if orders_count > 0:
            return Response(
                {
                    "detail": f"Невозможно удалить зону '{instance.name}'. "
                             f"Она используется в {orders_count} заказах. "
                             f"Вместо удаления отключите зону (сделайте неактивной)."
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Проверяем, используется ли зона в ценах
        prices_count = Pricing.objects.filter(
            Q(zone_from=instance) | Q(zone_to=instance)
        ).count()
        
        if prices_count > 0:
            return Response(
                {
                    "detail": f"Невозможно удалить зону '{instance.name}'. "
                             f"Она используется в {prices_count} ценах. "
                             f"Сначала удалите связанные цены или отключите зону."
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Если зона не используется, удаляем её
        try:
            self.perform_destroy(instance)
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            return Response(
                {"detail": f"Ошибка при удалении зоны: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'], url_path='detect-by-address', permission_classes=[permissions.IsAuthenticated])
    def detect_by_address(self, request):
        """
        Определить зону по адресу
        Принимает: {"address": "Сочи, ул. Навагинская, 1"}
        Возвращает: данные зоны или ошибку
        Доступно всем аутентифицированным пользователям
        """
        address = request.data.get('address')
        if not address:
            return Response(
                {"detail": "Адрес не указан"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Геокодирование адреса через Яндекс API
        try:
            geocode_url = 'https://geocode-maps.yandex.ru/1.x/'
            params = {
                'apikey': settings.YANDEX_MAPS_API_KEY,
                'geocode': address,
                'format': 'json',
                'results': 1
            }
            
            response = requests.get(geocode_url, params=params, timeout=5)
            response.raise_for_status()
            data = response.json()
            
            # Извлекаем координаты
            geo_object = data.get('response', {}).get('GeoObjectCollection', {}).get('featureMember', [])
            if not geo_object:
                return Response(
                    {"detail": "Адрес не найден"},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            coords_str = geo_object[0]['GeoObject']['Point']['pos']
            lon, lat = map(float, coords_str.split())
            point = Point(lon, lat)
            
            # Ищем зону, в которую попадает точка
            zones = Zone.objects.filter(is_active=True, geometry__isnull=False)
            for zone in zones:
                try:
                    polygon = shape(zone.geometry)
                    if polygon.contains(point):
                        return Response({
                            'zone': ZoneSerializer(zone).data,
                            'coordinates': {'lat': lat, 'lon': lon}
                        })
                except Exception as e:
                    # Пропускаем зоны с некорректной геометрией
                    continue
            
            # Зона не найдена
            return Response(
                {
                    "detail": "Адрес найден, но не попадает ни в одну зону",
                    "coordinates": {'lat': lat, 'lon': lon}
                },
                status=status.HTTP_404_NOT_FOUND
            )
            
        except requests.RequestException as e:
            return Response(
                {"detail": f"Ошибка геокодирования: {str(e)}"},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )
        except Exception as e:
            return Response(
                {"detail": f"Внутренняя ошибка: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'], url_path='detect-by-coordinates', permission_classes=[permissions.IsAuthenticated])
    def detect_by_coordinates(self, request):
        """
        Определить зону по координатам
        Принимает: {"lat": 43.5855, "lon": 39.7231}
        Возвращает: данные зоны или ошибку
        Доступно всем аутентифицированным пользователям
        """
        lat = request.data.get('lat')
        lon = request.data.get('lon')
        
        if lat is None or lon is None:
            return Response(
                {"detail": "Координаты не указаны"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            point = Point(float(lon), float(lat))
            
            # Ищем зону, в которую попадает точка
            zones = Zone.objects.filter(is_active=True, geometry__isnull=False)
            for zone in zones:
                try:
                    polygon = shape(zone.geometry)
                    if polygon.contains(point):
                        return Response({
                            'zone': ZoneSerializer(zone).data,
                            'coordinates': {'lat': lat, 'lon': lon}
                        })
                except Exception:
                    continue
            
            return Response(
                {"detail": "Координаты не попадают ни в одну зону"},
                status=status.HTTP_404_NOT_FOUND
            )
            
        except (ValueError, TypeError) as e:
            return Response(
                {"detail": f"Некорректные координаты: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST
            )


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
