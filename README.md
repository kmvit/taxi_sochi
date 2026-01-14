# Taxi PWA - Сервис такси для Сочи 🚖

MVP PWA-приложение для управления заказами такси с тремя типами пользователей.

## 🎉 Последнее обновление (Январь 2026)

**Добавлена система push-уведомлений!**
- ✅ Web Push уведомления (без сторонних сервисов)
- ✅ Уведомления водителям о новых заказах (с фильтрацией по категории авто)
- ✅ Уведомления администраторам о событиях заказов
- ✅ Автоматическая регистрация подписок
- ✅ Управление уведомлениями в профиле

**Полноценный функционал администратора:**
- ✅ CRUD для водителей прямо из интерфейса
- ✅ CRUD для автомобилей
- ✅ CRUD для прайс-листа
- ✅ Редактирование и управление заказами
- ✅ Назначение водителей на заказы
- ✅ Изменение статусов заказов
- ✅ Современные модальные окна
- ✅ Адаптивный дизайн

## Описание

Сервис позволяет:
- **Заказчикам** создавать заказы на трансфер с автоматическим расчетом цены
- **Водителям** просматривать и брать доступные заказы
- **Администраторам** полностью управлять системой через веб-интерфейс

## Технологический стек

### Backend
- Django 5.0
- Django REST Framework
- PostgreSQL
- JWT аутентификация
- Web Push уведомления (pywebpush)

### Frontend
- React
- React Router
- Axios
- PWA (Progressive Web App)
- Web Push API

## Структура проекта

```
taxi-pwa/
├── backend/        # Django REST API
└── frontend/       # React PWA приложение
```

## Быстрый старт

### Требования

- Python 3.10+
- Node.js 18+
- PostgreSQL 14+

### Backend

1. Перейдите в директорию backend:
```bash
cd backend
```

2. Создайте виртуальное окружение и активируйте его:
```bash
python3 -m venv venv
source venv/bin/activate  # macOS/Linux
# или
venv\Scripts\activate  # Windows
```

3. Установите зависимости:
```bash
pip install -r requirements.txt
```

4. Создайте базу данных PostgreSQL:
```bash
createdb taxi_pwa_db
# или через psql:
# CREATE DATABASE taxi_pwa_db;
```

5. Настройте переменные окружения. Создайте файл `backend/.env`:
```bash
# Django настройки
SECRET_KEY=django-insecure-mvp-dev-key-change-in-production-12345
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# База данных
DATABASE_NAME=taxi_pwa_db
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_HOST=localhost
DATABASE_PORT=5432

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# Web Push уведомления (VAPID ключи)
# Сгенерируйте их командой: python manage.py generate_vapid_keys
VAPID_PRIVATE_KEY="ваш_приватный_ключ"
VAPID_PUBLIC_KEY=ваш_публичный_ключ
VAPID_ADMIN_EMAIL=mailto:admin@your-domain.com
```

6. Сгенерируйте VAPID ключи для push-уведомлений:
```bash
python manage.py generate_vapid_keys
```
Скопируйте выведенные ключи в `.env` файл.

7. Примените миграции:
```bash
python manage.py makemigrations
python manage.py migrate
```

8. Создайте начальные данные (зоны, классы авто, тестовых пользователей):
```bash
python manage.py create_initial_data
```

9. (Опционально) Создайте суперпользователя для Django Admin:
```bash
python manage.py createsuperuser
```

10. Запустите сервер:
```bash
python manage.py runserver
```

Backend будет доступен по адресу: **http://localhost:8000**

### Frontend

1. Откройте новый терминал и перейдите в директорию frontend:
```bash
cd frontend
```

2. Установите зависимости:
```bash
npm install
```

3. (Опционально) Настройте переменные окружения. Создайте файл `frontend/.env`:
```bash
# API URL (по умолчанию http://localhost:8000/api)
REACT_APP_API_URL=http://localhost:8000/api
```

**Примечание:** Публичный VAPID ключ автоматически получается с сервера, дополнительных настроек не требуется.

4. Запустите development сервер:
```bash
npm start
```

Frontend будет доступен по адресу: **http://localhost:3000**

### Проверка работы

1. Откройте браузер: **http://localhost:3000**
2. Войдите с тестовыми данными:
   - **Админ**: `admin` / `admin123`
   - **Водитель**: `ivan` / `ivan123`
   - **Заказчик**: `customer` / `customer123`
3. Перейдите в Профиль и включите push-уведомления
4. Создайте тестовый заказ - водители с подходящей категорией авто получат уведомление!

## Функциональность

### Кабинет заказчика
- Создание заказа на трансфер
- Выбор маршрута (зон)
- Выбор класса автомобиля
- Автоматический расчет стоимости
- История заказов
- Push-уведомления о статусе заказа

### Кабинет водителя
- Лента доступных заказов (фильтрация по категории авто)
- Взятие заказа
- Управление статусами заказа (взял/еду/выполнено)
- Управление своими автомобилями
- Редактирование профиля
- **Push-уведомления:**
  - Новые заказы (только с подходящей категорией авто)
  - Заказы снова доступны (когда другой водитель отменил)
  - Обновления данных заказа

### Кабинет администратора
- **Управление водителями (CRUD)** - создание, редактирование, удаление
- **Управление автомобилями (CRUD)** - полное управление автопарком
- **Управление прайс-листом (CRUD)** - добавление и изменение цен
- **Управление заказами** - назначение водителей, изменение статусов, отмена
- Фильтрация и поиск по всем сущностям
- Статистика и dashboard
- **Push-уведомления:**
  - Новый заказ создан
  - Заказ отменен водителем
  - Заказ завершен

## Push-уведомления

Система использует стандартный **Web Push Protocol (VAPID)** - без сторонних сервисов!

### Настройка

1. Сгенерируйте VAPID ключи:
```bash
cd backend
python manage.py generate_vapid_keys
```

2. Добавьте ключи в `backend/.env` (см. раздел Backend выше)

3. Перезапустите backend сервер

### Как работает

- **Водители** получают уведомления только о заказах с подходящей категорией их автомобиля
- **Администраторы** получают уведомления о всех важных событиях
- Уведомления работают даже когда приложение закрыто
- Полная приватность - данные не уходят третьим лицам

### Управление уведомлениями

Перейдите в **Профиль → Настройки уведомлений** для включения/выключения.

## Дополнительная информация

- Минимальное время до подачи: +1 час от текущего времени
- Фиксированные цены между зонами
- Поддержка классов авто: Стандарт, Комфорт, Минивэн, и др.
- Работа только в зоне Сочи
- Push-уведомления через Web Push API (без Firebase)

## 📚 Документация

| Файл | Описание |
|------|----------|
| [`PROJECT_SUMMARY.md`](PROJECT_SUMMARY.md) | Полное описание проекта и функций |
| [`SETUP.md`](SETUP.md) | Детальная инструкция по установке |
| [`QUICKSTART_NOTIFICATIONS.md`](QUICKSTART_NOTIFICATIONS.md) | Быстрый старт push-уведомлений |

## 🔐 Тестовые данные

После выполнения `python manage.py create_initial_data` доступны:

- **Администратор:** `admin` / `admin123`
- **Водители:** 
  - `ivan` / `ivan123`
  - `alexey` / `alexey123`
  - `vitaliy` / `vitaliy123`
  - `egor` / `egor123`
- **Заказчик:** `customer` / `customer123`

## 🚀 Полный список команд для запуска

### Первый запуск (с нуля)

```bash
# 1. Backend - установка
cd backend
python3 -m venv venv
source venv/bin/activate  # или venv\Scripts\activate на Windows
pip install -r requirements.txt

# 2. База данных
createdb taxi_pwa_db

# 3. Настройка .env
# Создайте backend/.env с настройками (см. раздел Backend выше)

# 4. VAPID ключи для уведомлений
python manage.py generate_vapid_keys
# Скопируйте ключи в backend/.env

# 5. Миграции
python manage.py makemigrations
python manage.py migrate

# 6. Начальные данные
python manage.py create_initial_data

# 7. Запуск backend
python manage.py runserver
```

```bash
# 8. Frontend - установка (в новом терминале)
cd frontend
npm install

# 9. Запуск frontend
npm start
```

### Обычный запуск (после первого раза)

```bash
# Terminal 1 - Backend
cd backend
source venv/bin/activate
python manage.py runserver

# Terminal 2 - Frontend
cd frontend
npm start
```

### Полезные команды

```bash
# Создать суперпользователя Django Admin
python manage.py createsuperuser

# Применить новые миграции
python manage.py makemigrations
python manage.py migrate

# Пересоздать начальные данные
python manage.py create_initial_data

# Сгенерировать новые VAPID ключи
python manage.py generate_vapid_keys

# Собрать frontend для production
cd frontend
npm run build
```

## Лицензия

MIT
