"""
Команда для создания начальных данных
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from apps.drivers.models import Driver
from apps.cars.models import Car, CarClass
from apps.pricing.models import Zone, Pricing
from apps.orders.models import Order

User = get_user_model()


class Command(BaseCommand):
    help = 'Создает начальные данные для тестирования'

    def handle(self, *args, **options):
        self.stdout.write('Создание начальных данных...')
        
        # Создаем классы автомобилей
        self.stdout.write('Создание классов автомобилей...')
        car_classes = {
            'standard': CarClass.objects.get_or_create(
                name='Стандарт',
                defaults={'order': 1, 'description': 'Седан, хэтчбек'}
            )[0],
            'comfort': CarClass.objects.get_or_create(
                name='Комфорт',
                defaults={'order': 2, 'description': 'Комфортабельный седан'}
            )[0],
            'minivan': CarClass.objects.get_or_create(
                name='Минивэн',
                defaults={'order': 3, 'description': 'Минивэн до 7 мест'}
            )[0],
            'minivan_vip': CarClass.objects.get_or_create(
                name='Минивэн VIP',
                defaults={'order': 4, 'description': 'VIP минивэн'}
            )[0],
            's_class': CarClass.objects.get_or_create(
                name='S-Class',
                defaults={'order': 5, 'description': 'Mercedes S-Class'}
            )[0],
            'microbus': CarClass.objects.get_or_create(
                name='Микроавтобус',
                defaults={'order': 6, 'description': 'До 20 мест'}
            )[0],
            'bus': CarClass.objects.get_or_create(
                name='Автобус',
                defaults={'order': 7, 'description': 'Более 20 мест'}
            )[0],
        }
        
        # Создаем зоны
        self.stdout.write('Создание зон...')
        zones = {
            'center': Zone.objects.get_or_create(
                name='Центр Сочи',
                defaults={'order': 1, 'description': 'Центральный район Сочи'}
            )[0],
            'airport': Zone.objects.get_or_create(
                name='Международный аэропорт Сочи (Адлер)',
                defaults={'order': 2, 'description': 'Аэропорт'}
            )[0],
            'adler': Zone.objects.get_or_create(
                name='Адлер (Сириус)',
                defaults={'order': 3, 'description': 'Адлерский район'}
            )[0],
            'krasnaya_polyana_540': Zone.objects.get_or_create(
                name='Красная Поляна 540',
                defaults={'order': 4, 'description': 'Красная Поляна, отметка 540'}
            )[0],
            'krasnaya_polyana_960': Zone.objects.get_or_create(
                name='Красная Поляна 960',
                defaults={'order': 5, 'description': 'Красная Поляна, отметка 960'}
            )[0],
            'krasnaya_polyana_1170': Zone.objects.get_or_create(
                name='Красная Поляна 1170',
                defaults={'order': 6, 'description': 'Красная Поляна, отметка 1170'}
            )[0],
            'krasnaya_polyana_1389': Zone.objects.get_or_create(
                name='Красная Поляна 1389',
                defaults={'order': 7, 'description': 'Красная Поляна, отметка 1389'}
            )[0],
        }
        
        # Создаем примеры цен
        self.stdout.write('Создание прайс-листа...')
        
        # Центр Сочи - Аэропорт
        Pricing.objects.get_or_create(
            zone_from=zones['center'],
            zone_to=zones['airport'],
            car_class=car_classes['standard'],
            defaults={'price_client': 2000, 'price_driver': 1500}
        )
        Pricing.objects.get_or_create(
            zone_from=zones['center'],
            zone_to=zones['airport'],
            car_class=car_classes['comfort'],
            defaults={'price_client': 2500, 'price_driver': 2000}
        )
        
        # Аэропорт - Центр Сочи (обратно)
        Pricing.objects.get_or_create(
            zone_from=zones['airport'],
            zone_to=zones['center'],
            car_class=car_classes['standard'],
            defaults={'price_client': 2000, 'price_driver': 1500}
        )
        Pricing.objects.get_or_create(
            zone_from=zones['airport'],
            zone_to=zones['center'],
            car_class=car_classes['comfort'],
            defaults={'price_client': 2500, 'price_driver': 2000}
        )
        
        # Аэропорт - Адлер
        Pricing.objects.get_or_create(
            zone_from=zones['airport'],
            zone_to=zones['adler'],
            car_class=car_classes['standard'],
            defaults={'price_client': 800, 'price_driver': 600}
        )
        Pricing.objects.get_or_create(
            zone_from=zones['airport'],
            zone_to=zones['adler'],
            car_class=car_classes['comfort'],
            defaults={'price_client': 1000, 'price_driver': 800}
        )
        
        # Адлер - Красная Поляна 540
        Pricing.objects.get_or_create(
            zone_from=zones['adler'],
            zone_to=zones['krasnaya_polyana_540'],
            car_class=car_classes['standard'],
            defaults={'price_client': 1500, 'price_driver': 1200}
        )
        Pricing.objects.get_or_create(
            zone_from=zones['adler'],
            zone_to=zones['krasnaya_polyana_540'],
            car_class=car_classes['minivan'],
            defaults={'price_client': 2500, 'price_driver': 2000}
        )
        
        # Создаем админа
        self.stdout.write('Создание администратора...')
        if not User.objects.filter(username='admin').exists():
            User.objects.create_superuser(
                username='admin',
                email='admin@taxisochi.net',
                password='admin123',
                role='admin',
                first_name='Администратор',
                last_name='Системы'
            )
            self.stdout.write(self.style.SUCCESS('Создан админ: admin / admin123'))
        
        # Создаем тестовых водителей
        self.stdout.write('Создание водителей...')
        
        # Водитель 1: Иван (Стандарт/Комфорт)
        if not User.objects.filter(username='ivan').exists():
            ivan_user = User.objects.create_user(
                username='ivan',
                password='ivan123',
                role='driver',
                phone='+79384440150'
            )
            ivan_driver = Driver.objects.create(
                user=ivan_user,
                first_name='Иван',
                last_name='Иванов',
                phone='+79384440150'
            )
            Car.objects.create(
                driver=ivan_driver,
                car_class=car_classes['comfort'],
                brand='Chery',
                model='Togo 7 Pro Max',
                color='Белый',
                license_plate='О767ТК193'
            )
            self.stdout.write(self.style.SUCCESS('Создан водитель: ivan / ivan123'))
        
        # Водитель 2: Алексей (Комфорт)
        if not User.objects.filter(username='alexey').exists():
            alexey_user = User.objects.create_user(
                username='alexey',
                password='alexey123',
                role='driver',
                phone='+79873681778'
            )
            alexey_driver = Driver.objects.create(
                user=alexey_user,
                first_name='Алексей',
                last_name='Алексеев',
                phone='+79873681778'
            )
            Car.objects.create(
                driver=alexey_driver,
                car_class=car_classes['comfort'],
                brand='Kia',
                model='K5',
                color='Белый',
                license_plate='В502ТУ164'
            )
            self.stdout.write(self.style.SUCCESS('Создан водитель: alexey / alexey123'))
        
        # Водитель 3: Виталий (Минивэн)
        if not User.objects.filter(username='vitaliy').exists():
            vitaliy_user = User.objects.create_user(
                username='vitaliy',
                password='vitaliy123',
                role='driver',
                phone='+79183022542'
            )
            vitaliy_driver = Driver.objects.create(
                user=vitaliy_user,
                first_name='Виталий',
                last_name='Виталиев',
                phone='+79183022542'
            )
            Car.objects.create(
                driver=vitaliy_driver,
                car_class=car_classes['minivan'],
                brand='Hyundai',
                model='Starex',
                color='Черный',
                license_plate='Х786НР123'
            )
            self.stdout.write(self.style.SUCCESS('Создан водитель: vitaliy / vitaliy123'))
        
        # Водитель 4: Егор (Минивэн VIP)
        if not User.objects.filter(username='egor').exists():
            egor_user = User.objects.create_user(
                username='egor',
                password='egor123',
                role='driver',
                phone='+79286677055'
            )
            egor_driver = Driver.objects.create(
                user=egor_user,
                first_name='Егор',
                last_name='Егоров',
                phone='+79286677055'
            )
            Car.objects.create(
                driver=egor_driver,
                car_class=car_classes['minivan_vip'],
                brand='Mercedes',
                model='V-Class',
                color='Черный',
                license_plate='К353СА123'
            )
            self.stdout.write(self.style.SUCCESS('Создан водитель: egor / egor123'))
        
        # Создаем тестового заказчика
        self.stdout.write('Создание тестового заказчика...')
        customer_user = None
        if not User.objects.filter(username='customer').exists():
            customer_user = User.objects.create_user(
                username='customer',
                email='customer@example.com',
                password='customer123',
                role='customer',
                first_name='Юрий',
                last_name='Кузнецов',
                phone='+79189714238'
            )
            self.stdout.write(self.style.SUCCESS('Создан заказчик: customer / customer123'))
        else:
            customer_user = User.objects.get(username='customer')
        
        # Создаем тестовые заказы
        self.stdout.write('Создание тестовых заказов...')
        
        # Заказ 1: Аэропорт -> Центр Сочи, Комфорт (для Ивана или Алексея)
        try:
            pricing1 = Pricing.objects.get(
                zone_from=zones['airport'],
                zone_to=zones['center'],
                car_class=car_classes['comfort']
            )
            Order.objects.get_or_create(
                customer=customer_user,
                passenger_name='Петров Петр Петрович',
                passenger_phone='+79001234567',
                defaults={
                    'passenger_count': 2,
                    'zone_from': zones['airport'],
                    'zone_to': zones['center'],
                    'address_from': 'Терминал 1, выход 3',
                    'address_to': 'Центральная площадь',
                    'pickup_time': timezone.now() + timedelta(hours=2),
                    'direction': 'oneway',
                    'car_class': car_classes['comfort'],
                    'flight_number': 'SU 1234',
                    'comment': 'Большой багаж',
                    'price_client': pricing1.price_client,
                    'price_driver': pricing1.price_driver,
                    'status': 'pending',
                    'is_paid': True,
                    'payment_method': 'mock'
                }
            )
            self.stdout.write(self.style.SUCCESS('Создан тестовый заказ 1 (Аэропорт -> Центр, Комфорт)'))
        except Exception as e:
            self.stdout.write(self.style.WARNING(f'Не удалось создать заказ 1: {e}'))
        
        # Заказ 2: Центр Сочи -> Аэропорт, Стандарт
        try:
            pricing2 = Pricing.objects.get(
                zone_from=zones['center'],
                zone_to=zones['airport'],
                car_class=car_classes['standard']
            )
            Order.objects.get_or_create(
                customer=customer_user,
                passenger_name='Сидоров Сидор Сидорович',
                passenger_phone='+79007654321',
                defaults={
                    'passenger_count': 1,
                    'zone_from': zones['center'],
                    'zone_to': zones['airport'],
                    'address_from': 'ул. Ленина, 5',
                    'address_to': 'Терминал 2',
                    'pickup_time': timezone.now() + timedelta(hours=3),
                    'direction': 'oneway',
                    'car_class': car_classes['standard'],
                    'flight_number': 'SU 5678',
                    'comment': '',
                    'price_client': pricing2.price_client,
                    'price_driver': pricing2.price_driver,
                    'status': 'pending',
                    'is_paid': True,
                    'payment_method': 'mock'
                }
            )
            self.stdout.write(self.style.SUCCESS('Создан тестовый заказ 2 (Центр -> Аэропорт, Стандарт)'))
        except Exception as e:
            self.stdout.write(self.style.WARNING(f'Не удалось создать заказ 2: {e}'))
        
        # Заказ 3: Адлер -> Красная Поляна 540, Минивэн (для Виталия)
        try:
            pricing3 = Pricing.objects.get(
                zone_from=zones['adler'],
                zone_to=zones['krasnaya_polyana_540'],
                car_class=car_classes['minivan']
            )
            Order.objects.get_or_create(
                customer=customer_user,
                passenger_name='Иванова Мария Ивановна',
                passenger_phone='+79005555555',
                defaults={
                    'passenger_count': 5,
                    'zone_from': zones['adler'],
                    'zone_to': zones['krasnaya_polyana_540'],
                    'address_from': 'Вокзал Адлер',
                    'address_to': 'Отель Гранд Поляна',
                    'pickup_time': timezone.now() + timedelta(hours=4),
                    'direction': 'oneway',
                    'car_class': car_classes['minivan'],
                    'flight_number': '',
                    'comment': 'Семья с детьми, нужен детское кресло',
                    'price_client': pricing3.price_client,
                    'price_driver': pricing3.price_driver,
                    'status': 'pending',
                    'is_paid': True,
                    'payment_method': 'mock'
                }
            )
            self.stdout.write(self.style.SUCCESS('Создан тестовый заказ 3 (Адлер -> Красная Поляна, Минивэн)'))
        except Exception as e:
            self.stdout.write(self.style.WARNING(f'Не удалось создать заказ 3: {e}'))
        
        # Заказ 4: Аэропорт -> Адлер, Комфорт (уже оплачен, можно взять)
        try:
            pricing4 = Pricing.objects.get(
                zone_from=zones['airport'],
                zone_to=zones['adler'],
                car_class=car_classes['comfort']
            )
            Order.objects.get_or_create(
                customer=customer_user,
                passenger_name='Кузнецов Юрий Сергеевич',
                passenger_phone='+79189714238',
                defaults={
                    'passenger_count': 2,
                    'zone_from': zones['airport'],
                    'zone_to': zones['adler'],
                    'address_from': 'Международный аэропорт Сочи (Адлер)',
                    'address_to': 'Вокзал Адлер',
                    'pickup_time': timezone.now() + timedelta(hours=5),
                    'direction': 'oneway',
                    'car_class': car_classes['comfort'],
                    'flight_number': 'SU 6561',
                    'comment': '',
                    'price_client': pricing4.price_client,
                    'price_driver': pricing4.price_driver,
                    'status': 'pending',
                    'is_paid': True,
                    'payment_method': 'mock'
                }
            )
            self.stdout.write(self.style.SUCCESS('Создан тестовый заказ 4 (Аэропорт -> Адлер, Комфорт)'))
        except Exception as e:
            self.stdout.write(self.style.WARNING(f'Не удалось создать заказ 4: {e}'))
        
        self.stdout.write(self.style.SUCCESS('Начальные данные успешно созданы!'))
        self.stdout.write('')
        self.stdout.write('Учетные данные:')
        self.stdout.write('  Админ: admin / admin123')
        self.stdout.write('  Водители: ivan, alexey, vitaliy, egor / [username]123')
        self.stdout.write('  Заказчик: customer / customer123')
        self.stdout.write('')
        self.stdout.write('Создано тестовых заказов: 4')