from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from . import views

urlpatterns = [
    # JWT Authentication
    path('auth/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/register/', views.RegistrationView.as_view(), name='register'),
    
    # User Profile
    path('profile/', views.ProfileView.as_view(), name='profile'),
    path('profile/change-password/', views.ChangePasswordView.as_view(), name='change_password'),
    path('auth/me/', views.current_user, name='current_user'),
    
    # Device Tokens & Web Push
    path('device-token/register/', views.register_device_token, name='register_device_token'),
    path('device-token/unregister/', views.unregister_device_token, name='unregister_device_token'),
    path('vapid-public-key/', views.get_vapid_public_key, name='vapid_public_key'),
]
