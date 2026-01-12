# Инструкция по запуску проекта Taxi PWA

## Требования

- Python 3.10+
- Node.js 18+
- PostgreSQL 14+

## Шаг 1: Настройка базы данных

1. Создайте базу данных PostgreSQL:

```bash
createdb taxi_pwa_db
```

2. Или через psql:

```sql
CREATE DATABASE taxi_pwa_db;
CREATE USER taxi_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE taxi_pwa_db TO taxi_user;
```

## Шаг 2: Настройка Backend

1. Перейдите в директорию backend:

```bash
cd backend
```

2. Создайте виртуальное окружение:

```bash
python3 -m venv venv
source venv/bin/activate  # для macOS/Linux
# или
venv\Scripts\activate  # для Windows
```

3. Установите зависимости:

```bash
pip install -r requirements.txt
```

4. Настройте переменные окружения (файл `.env` уже создан):

Отредактируйте `backend/.env` при необходимости:
```
DEBUG=True
SECRET_KEY=django-insecure-mvp-dev-key-change-in-production-12345
DATABASE_NAME=taxi_pwa_db
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_HOST=localhost
DATABASE_PORT=5432
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

5. Примените миграции:

```bash
python manage.py makemigrations
python manage.py migrate
```

6. Создайте начальные данные (зоны, классы авто, тестовых пользователей):

```bash
python manage.py create_initial_data
```

Эта команда создаст:
- Классы автомобилей (Стандарт, Комфорт, Минивэн, и т.д.)
- Зоны в Сочи (Центр, Аэропорт, Адлер, Красная Поляна)
- Примеры цен в прайс-листе
- Тестовых пользователей:
  - Админ: `admin` / `admin123`
  - Водителей: `ivan`, `alexey`, `vitaliy`, `egor` / `[username]123`
  - Заказчика: `customer` / `customer123`

7. Запустите сервер:

```bash
python manage.py runserver
```

Backend будет доступен по адресу: http://localhost:8000

## Шаг 3: Настройка Frontend

1. Откройте новый терминал и перейдите в директорию frontend:

```bash
cd frontend
```

2. Установите зависимости:

```bash
npm install
```

3. Запустите development сервер:

```bash
npm start
```

Frontend будет доступен по адресу: http://localhost:3000

## Шаг 4: Проверка работы

1. Откройте браузер и перейдите на http://localhost:3000

2. Войдите с одной из учетных записей:
   - **Админ**: `admin` / `admin123`
   - **Водитель**: `ivan` / `ivan123`
   - **Заказчик**: `customer` / `customer123`

3. Проверьте функционал:
   - **Заказчик**: Создание заказа, просмотр истории
   - **Водитель**: Просмотр доступных заказов, взятие заказа, изменение статуса
   - **Админ**: Просмотр всех заказов, управление через Django Admin

## Django Admin

Для полного управления данными используйте Django Admin панель:

1. Перейдите на http://localhost:8000/admin

2. Войдите с учетными данными админа: `admin` / `admin123`

3. Здесь вы можете:
   - Управлять пользователями
   - Добавлять/редактировать водителей
   - Управлять автомобилями
   - Настраивать прайс-лист
   - Управлять зонами и классами авто
   - Просматривать все заказы

## Тестирование функционала

### Сценарий 1: Создание заказа заказчиком

1. Войдите как `customer` / `customer123`
2. Нажмите "Создать заказ"
3. Заполните форму:
   - Пассажир: Иванов Иван, +79001234567
   - Откуда: Международный аэропорт Сочи (Адлер)
   - Куда: Центр Сочи
   - Класс: Стандарт
   - Время: Выберите время через 2 часа
4. Система покажет цену (2000₽)
5. Создайте заказ

### Сценарий 2: Взятие заказа водителем

1. Выйдите и войдите как `ivan` / `ivan123`
2. Нажмите "Доступные заказы"
3. Вы увидите заказ, созданный в предыдущем сценарии
4. Нажмите "Взять заказ"
5. Перейдите в "Мои заказы"
6. Измените статус: "Еду к клиенту" → "Выполнено"

### Сценарий 3: Управление через админку

1. Войдите как `admin` / `admin123`
2. Перейдите в Django Admin (http://localhost:8000/admin)
3. Добавьте новый прайс между зонами
4. Создайте нового водителя и привяжите к нему автомобиль

## PWA функционал

### Установка приложения

1. Откройте сайт на мобильном устройстве или в Chrome
2. В меню браузера выберите "Установить приложение"
3. Приложение установится на домашний экран
4. Запустите его как обычное приложение

### Service Worker

Service Worker автоматически регистрируется в production режиме. Для тестирования:

1. Соберите production версию:
```bash
cd frontend
npm run build
```

2. Запустите с помощью serve:
```bash
npx serve -s build
```

## Возможные проблемы

### Ошибка подключения к БД

Убедитесь, что:
- PostgreSQL запущен
- База данных `taxi_pwa_db` создана
- Учетные данные в `.env` правильные

### CORS ошибки

Проверьте, что:
- Backend запущен на порту 8000
- Frontend запущен на порту 3000
- В `backend/.env` указаны правильные CORS_ALLOWED_ORIGINS

### Миграции не применяются

Попробуйте:
```bash
python manage.py makemigrations --empty users
python manage.py migrate --run-syncdb
```

## Production Deployment

### Backend

1. Измените настройки в `.env`:
```
DEBUG=False
SECRET_KEY=<сгенерируйте надежный ключ>
ALLOWED_HOSTS=your-domain.com
```

2. Соберите статические файлы:
```bash
python manage.py collectstatic
```

3. Используйте Gunicorn + Nginx

### Frontend

1. Создайте `.env.production`:
```
REACT_APP_API_URL=https://your-api-domain.com/api
```

2. Соберите:
```bash
npm run build
```

3. Разверните содержимое `build/` на хостинге

## Дополнительная информация

- Backend API документация: http://localhost:8000/api/
- Django Admin: http://localhost:8000/admin/
- Frontend: http://localhost:3000/

Для вопросов и предложений создавайте issues в репозитории проекта.
