from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'cars', views.CarViewSet, basename='car')
router.register(r'car-classes', views.CarClassViewSet, basename='car-class')

urlpatterns = [
    path('', include(router.urls)),
]
