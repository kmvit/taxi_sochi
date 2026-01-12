# Taxi PWA - Backend

Django REST API для сервиса такси в Сочи.

## Установка

1. Создайте виртуальное окружение:
```bash
python3 -m venv venv
source venv/bin/activate  # для macOS/Linux
# или
venv\Scripts\activate  # для Windows
```

2. Установите зависимости:
```bash
pip install -r requirements.txt
```

3. Настройте переменные окружения:
```bash
cp .env.example .env
# Отредактируйте .env файл с вашими настройками
```

4. Создайте базу данных PostgreSQL:
```bash
createdb taxi_pwa_db
```

5. Примените миграции:
```bash
python manage.py makemigrations
python manage.py migrate
```

6. Создайте суперпользователя:
```bash
python manage.py createsuperuser
```

7. Загрузите начальные данные (опционально):
```bash
python manage.py loaddata initial_data.json
```

8. Запустите сервер:
```bash
python manage.py runserver
```

## API Endpoints

### Аутентификация
- `POST /api/auth/login/` - Вход (получение JWT токенов)
- `POST /api/auth/refresh/` - Обновление токена
- `POST /api/auth/register/` - Регистрация
- `GET /api/auth/me/` - Текущий пользователь

### Профиль
- `GET /api/profile/` - Получить профиль
- `PUT /api/profile/` - Обновить профиль
- `POST /api/profile/change-password/` - Сменить пароль

### Водители
- `GET /api/drivers/` - Список водителей
- `POST /api/drivers/` - Создать водителя (только админ)
- `GET /api/drivers/{id}/` - Получить водителя
- `PUT /api/drivers/{id}/` - Обновить водителя (только админ)
- `DELETE /api/drivers/{id}/` - Удалить водителя (только админ)
- `GET /api/drivers/me/` - Профиль текущего водителя

### Автомобили
- `GET /api/cars/` - Список авто
- `POST /api/cars/` - Добавить авто
- `GET /api/cars/{id}/` - Получить авто
- `PUT /api/cars/{id}/` - Обновить авто
- `DELETE /api/cars/{id}/` - Удалить авто
- `GET /api/cars/my_cars/` - Мои авто (для водителя)

### Классы автомобилей
- `GET /api/car-classes/` - Список классов

### Зоны
- `GET /api/zones/` - Список зон
- `POST /api/zones/` - Добавить зону (только админ)
- `GET /api/zones/{id}/` - Получить зону
- `PUT /api/zones/{id}/` - Обновить зону (только админ)
- `DELETE /api/zones/{id}/` - Удалить зону (только админ)

### Прайс-лист
- `GET /api/pricing/` - Список цен
- `POST /api/pricing/` - Добавить цену (только админ)
- `POST /api/pricing/get_price/` - Получить цену для маршрута

### Заказы
- `GET /api/orders/` - Список заказов
- `POST /api/orders/` - Создать заказ
- `GET /api/orders/{id}/` - Получить заказ
- `GET /api/orders/available/` - Доступные заказы (для водителя)
- `POST /api/orders/{id}/take/` - Взять заказ (для водителя)
- `POST /api/orders/{id}/update_status/` - Изменить статус заказа
- `GET /api/orders/my_orders/` - Мои заказы

## Роли пользователей

- **admin** - Администратор (полный доступ)
- **driver** - Водитель (просмотр и взятие заказов, управление своими авто)
- **customer** - Заказчик (создание заказов, просмотр своих заказов)

## Структура проекта

```
backend/
├── apps/
│   ├── users/       # Пользователи и аутентификация
│   ├── drivers/     # Профили водителей
│   ├── cars/        # Автомобили и классы
│   ├── pricing/     # Зоны и прайс-лист
│   └── orders/      # Заказы
├── config/          # Настройки Django
├── manage.py
└── requirements.txt
```
