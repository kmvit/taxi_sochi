from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.db import models
from .models import Order
from .serializers import (
    OrderSerializer,
    OrderCreateSerializer,
    OrderUpdateStatusSerializer
)
from apps.drivers.models import Driver


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
