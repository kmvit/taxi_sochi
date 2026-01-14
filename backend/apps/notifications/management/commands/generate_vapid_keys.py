from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = 'Генерирует VAPID ключи для Web Push уведомлений'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Генерация VAPID ключей...'))
        
        try:
            from py_vapid import Vapid
            from cryptography.hazmat.primitives import serialization
            import base64
            
            vapid = Vapid()
            vapid.generate_keys()
            
            # Правильно сериализуем приватный ключ
            private_pem = vapid.private_key.private_bytes(
                encoding=serialization.Encoding.PEM,
                format=serialization.PrivateFormat.TraditionalOpenSSL,
                encryption_algorithm=serialization.NoEncryption()
            ).decode('utf-8').strip()
            
            # Получаем публичный ключ в формате uncompressed point
            public_bytes = vapid.public_key.public_bytes(
                encoding=serialization.Encoding.X962,
                format=serialization.PublicFormat.UncompressedPoint
            )
            
            # Конвертируем в URL-safe base64 без padding
            public_key = base64.urlsafe_b64encode(public_bytes).decode('utf-8').rstrip('=')
            
            self.stdout.write('\n' + '='*60)
            self.stdout.write(self.style.SUCCESS('VAPID ключи успешно сгенерированы!'))
            self.stdout.write('='*60 + '\n')
            
            self.stdout.write(self.style.WARNING('Добавьте эти переменные в backend/.env:'))
            self.stdout.write('')
            self.stdout.write(f'VAPID_PRIVATE_KEY="{private_pem}"')
            self.stdout.write(f'VAPID_PUBLIC_KEY={public_key}')
            self.stdout.write(f'VAPID_ADMIN_EMAIL=mailto:admin@your-domain.com')
            self.stdout.write('')
            
            self.stdout.write(self.style.WARNING('Публичный ключ будет автоматически получен с сервера.'))
            self.stdout.write(self.style.WARNING('Frontend не требует дополнительных переменных окружения.'))
            self.stdout.write('')
            
            self.stdout.write('='*60)
            self.stdout.write(self.style.SUCCESS('ВАЖНО: Сохраните эти ключи в надежном месте!'))
            self.stdout.write('='*60 + '\n')
            
        except ImportError as e:
            self.stdout.write(self.style.ERROR(f'Ошибка импорта: {e}'))
            self.stdout.write('Установите: pip install pywebpush')
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Ошибка при генерации ключей: {e}'))
            import traceback
            self.stdout.write(traceback.format_exc())
