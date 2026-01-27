from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.db import models
from django.conf import settings
import requests
from shapely.geometry import Point, shape
from .models import Order
from .serializers import (
    OrderSerializer,
    OrderCreateSerializer,
    OrderUpdateStatusSerializer
)
from .text_parser import TextOrderParser
from apps.drivers.models import Driver
from apps.pricing.models import Zone, Pricing
from apps.cars.models import CarClass
from apps.pricing.serializers import ZoneSerializer


class OrderViewSet(viewsets.ModelViewSet):
    """ViewSet для управления заказами"""
    queryset = Order.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    
    def perform_destroy(self, instance):
        """
        Удалять заказы могут только администраторы
        """
        if self.request.user.role != 'admin':
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Только администраторы могут удалять заказы")
        instance.delete()
    
    def get_serializer_class(self):
        if self.action == 'create':
            return OrderCreateSerializer
        return OrderSerializer
    
    def get_queryset(self):
        queryset = Order.objects.all()
        user = self.request.user
        
        # Заказчики видят только свои заказы
        if user.role == 'customer':
            queryset = queryset.filter(customer=user)
        
        # Водители видят свои взятые заказы и доступные заказы
        elif user.role == 'driver':
            try:
                driver = Driver.objects.get(user=user)
                # Свои заказы или доступные для взятия
                queryset = queryset.filter(
                    models.Q(driver=driver) | 
                    models.Q(status='pending', driver__isnull=True)
                )
            except Driver.DoesNotExist:
                queryset = queryset.none()
        
        # Админы видят все
        # (для role='admin' фильтрация не нужна)
        
        return queryset
    
    @action(detail=False, methods=['get'])
    def available(self, request):
        """
        Получить доступные заказы для водителя
        (не взятые, со статусом pending)
        """
        if request.user.role != 'driver':
            return Response(
                {"detail": "Только для водителей"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            driver = Driver.objects.get(user=request.user)
            
            # Получаем классы авто водителя
            car_classes = driver.cars.filter(is_active=True).values_list('car_class', flat=True)
            
            # Заказы, которые еще не взяты и подходят по классу авто
            orders = Order.objects.filter(
                status='pending',
                driver__isnull=True,
                car_class__in=car_classes
            ).order_by('pickup_time')
            
            serializer = self.get_serializer(orders, many=True)
            return Response(serializer.data)
        
        except Driver.DoesNotExist:
            return Response(
                {"detail": "Профиль водителя не найден"},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['post'])
    def take(self, request, pk=None):
        """
        Взять заказ (для водителя)
        """
        if request.user.role != 'driver':
            return Response(
                {"detail": "Только для водителей"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        order = self.get_object()
        
        # Проверяем, что заказ еще не взят
        if order.status != 'pending' or order.driver is not None:
            return Response(
                {"detail": "Заказ уже взят другим водителем"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            driver = Driver.objects.get(user=request.user)
            
            # Проверяем, что у водителя есть подходящий автомобиль
            has_suitable_car = driver.cars.filter(
                car_class=order.car_class,
                is_active=True
            ).exists()
            
            if not has_suitable_car:
                return Response(
                    {"detail": "У вас нет подходящего автомобиля для этого заказа"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Назначаем водителя
            order.driver = driver
            order.status = 'taken'
            order.taken_at = timezone.now()
            order.save()
            
            serializer = self.get_serializer(order)
            return Response(serializer.data)
        
        except Driver.DoesNotExist:
            return Response(
                {"detail": "Профиль водителя не найден"},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """
        Отменить заказ (для водителя)
        """
        if request.user.role != 'driver':
            return Response(
                {"detail": "Только для водителей"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        order = self.get_object()
        
        try:
            driver = Driver.objects.get(user=request.user)
            
            # Проверяем, что это заказ данного водителя
            if order.driver != driver:
                return Response(
                    {"detail": "Вы можете отменить только свои заказы"},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Проверяем, что заказ еще не выполнен и не отменен
            if order.status == 'completed':
                return Response(
                    {"detail": "Нельзя отменить выполненный заказ"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if order.status == 'cancelled':
                return Response(
                    {"detail": "Заказ уже отменен"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Отменяем заказ и освобождаем его для других водителей
            order.driver = None
            order.status = 'pending'
            order.taken_at = None
            order.save()
            
            serializer = self.get_serializer(order)
            return Response({
                "detail": "Заказ отменен и возвращен в список доступных",
                "order": serializer.data
            })
        
        except Driver.DoesNotExist:
            return Response(
                {"detail": "Профиль водителя не найден"},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        """
        Изменить статус заказа
        """
        order = self.get_object()
        serializer = OrderUpdateStatusSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        new_status = serializer.validated_data['status']
        
        # Водитель может менять статус только своих заказов
        if request.user.role == 'driver':
            try:
                driver = Driver.objects.get(user=request.user)
                if order.driver != driver:
                    return Response(
                        {"detail": "Вы можете менять статус только своих заказов"},
                        status=status.HTTP_403_FORBIDDEN
                    )
            except Driver.DoesNotExist:
                return Response(
                    {"detail": "Профиль водителя не найден"},
                    status=status.HTTP_404_NOT_FOUND
                )
        
        # Заказчик не может менять статус
        elif request.user.role == 'customer':
            return Response(
                {"detail": "Заказчики не могут менять статус заказа"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Обновляем статус
        order.status = new_status
        
        if new_status == 'completed':
            order.completed_at = timezone.now()
        
        order.save()
        
        serializer = self.get_serializer(order)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def my_orders(self, request):
        """
        Получить заказы текущего пользователя
        """
        if request.user.role == 'customer':
            orders = Order.objects.filter(customer=request.user).order_by('-created_at')
        elif request.user.role == 'driver':
            try:
                driver = Driver.objects.get(user=request.user)
                orders = Order.objects.filter(driver=driver).order_by('-pickup_time')
            except Driver.DoesNotExist:
                return Response(
                    {"detail": "Профиль водителя не найден"},
                    status=status.HTTP_404_NOT_FOUND
                )
        else:
            orders = Order.objects.all().order_by('-created_at')
        
        serializer = self.get_serializer(orders, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def from_email(self, request):
        """
        Создать заказ из email (заглушка для будущей интеграции)
        Только для партнеров и админов
        """
        if request.user.role not in ['customer', 'admin']:
            return Response(
                {"detail": "Только для партнеров и администраторов"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        from .email_parser import EmailParser
        
        email_content = request.data.get('email_content', '')
        
        if not email_content:
            return Response(
                {"detail": "Требуется содержимое email"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        parser = EmailParser()
        order = parser.create_order_from_email(email_content, request.user)
        
        if order:
            serializer = self.get_serializer(order)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        else:
            return Response(
                {"detail": "Не удалось создать заказ из email"},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    def _detect_zone_by_address(self, address: str):
        """
        Вспомогательная функция для поиска зоны по адресу
        Возвращает (zone, error_message) или (None, None) если зона не найдена
        """
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
                return None, "Адрес не найден"
            
            coords_str = geo_object[0]['GeoObject']['Point']['pos']
            lon, lat = map(float, coords_str.split())
            point = Point(lon, lat)
            
            # Ищем зону, в которую попадает точка
            zones = Zone.objects.filter(is_active=True, geometry__isnull=False)
            for zone in zones:
                try:
                    polygon = shape(zone.geometry)
                    if polygon.contains(point):
                        return zone, None
                except Exception:
                    # Пропускаем зоны с некорректной геометрией
                    continue
            
            # Зона не найдена
            return None, None
            
        except requests.RequestException as e:
            return None, f"Ошибка геокодирования: {str(e)}"
        except Exception as e:
            return None, f"Внутренняя ошибка: {str(e)}"
    
    @action(detail=False, methods=['get'], url_path='zones-list')
    def zones_list(self, request):
        """
        Получить список всех активных зон для ручного выбора
        Только для администраторов
        """
        if request.user.role != 'admin':
            return Response(
                {"detail": "Только для администраторов"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        zones = Zone.objects.filter(is_active=True).order_by('order', 'name')
        serializer = ZoneSerializer(zones, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'], url_path='create-from-text')
    def create_from_text(self, request):
        """
        Создать заказ из текста
        Только для администраторов
        """
        if request.user.role != 'admin':
            return Response(
                {"detail": "Только для администраторов"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        text = request.data.get('text', '')
        zone_from_id = request.data.get('zone_from_id', None)
        zone_to_id = request.data.get('zone_to_id', None)
        
        if not text:
            return Response(
                {"detail": "Требуется текст заказа"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Парсим текст
        parser = TextOrderParser()
        try:
            parsed_data = parser.parse(text)
        except ValueError as e:
            return Response(
                {"detail": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Валидация обязательных полей
        is_valid, missing_fields = parser.validate_required_fields(parsed_data)
        if not is_valid:
            return Response(
                {
                    "detail": "Отсутствуют обязательные поля",
                    "missing_fields": missing_fields,
                    "parsed_data": parsed_data
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Поиск зон по адресам (если не указаны вручную)
        zone_from = None
        zone_to = None
        zones_not_found = []
        
        if zone_from_id:
            try:
                zone_from = Zone.objects.get(id=zone_from_id, is_active=True)
            except Zone.DoesNotExist:
                return Response(
                    {"detail": f"Зона с ID {zone_from_id} не найдена"},
                    status=status.HTTP_400_BAD_REQUEST
                )
        else:
            zone_from, error = self._detect_zone_by_address(parsed_data['address_from'])
            if not zone_from:
                zones_not_found.append('from')
        
        if zone_to_id:
            try:
                zone_to = Zone.objects.get(id=zone_to_id, is_active=True)
            except Zone.DoesNotExist:
                return Response(
                    {"detail": f"Зона с ID {zone_to_id} не найдена"},
                    status=status.HTTP_400_BAD_REQUEST
                )
        else:
            zone_to, error = self._detect_zone_by_address(parsed_data['address_to'])
            if not zone_to:
                zones_not_found.append('to')
        
        # Если зоны не найдены, возвращаем список зон для выбора
        if zones_not_found:
            zones = Zone.objects.filter(is_active=True).order_by('order', 'name')
            zones_data = ZoneSerializer(zones, many=True).data
            return Response(
                {
                    "detail": "Зоны не найдены по адресам",
                    "zones_not_found": zones_not_found,
                    "available_zones": zones_data,
                    "parsed_data": parsed_data
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Поиск класса автомобиля
        car_class = None
        if parsed_data.get('car_class'):
            car_class = CarClass.objects.filter(
                name__icontains=parsed_data['car_class'],
                is_active=True
            ).first()
            
            if not car_class:
                # Возвращаем список доступных классов
                car_classes = CarClass.objects.filter(is_active=True).order_by('order', 'name')
                from apps.cars.serializers import CarClassSerializer
                return Response(
                    {
                        "detail": f"Класс автомобиля '{parsed_data['car_class']}' не найден",
                        "available_car_classes": CarClassSerializer(car_classes, many=True).data,
                        "parsed_data": parsed_data
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Создаем заказ
        try:
            # Получаем цены из прайс-листа
            pricing = Pricing.objects.get(
                zone_from=zone_from,
                zone_to=zone_to,
                car_class=car_class,
                is_active=True
            )
        except Pricing.DoesNotExist:
            return Response(
                {
                    "detail": "Цена для данного маршрута не найдена",
                    "parsed_data": parsed_data
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Создаем заказ
        order = Order.objects.create(
            customer=request.user,
            passenger_name=parsed_data['passenger_name'],
            passenger_phone=parsed_data['passenger_phone'],
            passenger_count=parsed_data.get('passenger_count', 1),
            zone_from=zone_from,
            zone_to=zone_to,
            address_from=parsed_data.get('address_from', ''),
            address_to=parsed_data.get('address_to', ''),
            pickup_time=timezone.make_aware(parsed_data['pickup_time']),
            direction=parsed_data.get('direction', 'oneway'),
            car_class=car_class,
            flight_number=parsed_data.get('flight_number', ''),
            comment=parsed_data.get('comment', ''),
            price_client=pricing.price_client,
            price_driver=pricing.price_driver,
            is_paid=False,
            payment_method='admin_manual'
        )
        
        serializer = self.get_serializer(order)
        return Response(serializer.data, status=status.HTTP_201_CREATED)