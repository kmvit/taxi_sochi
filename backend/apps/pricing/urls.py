from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'zones', views.ZoneViewSet, basename='zone')
router.register(r'pricing', views.PricingViewSet, basename='pricing')

urlpatterns = [
    path('', include(router.urls)),
]
