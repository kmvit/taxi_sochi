from django.contrib import admin
from .models import NotificationLog


@admin.register(NotificationLog)
class NotificationLogAdmin(admin.ModelAdmin):
    list_display = ['id', 'recipient', 'notification_type', 'title', 'is_sent', 'created_at']
    list_filter = ['notification_type', 'is_sent', 'created_at']
    search_fields = ['recipient__username', 'title', 'body']
    readonly_fields = ['created_at']
    date_hierarchy = 'created_at'
