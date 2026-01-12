# Taxi PWA - Frontend

React PWA приложение для сервиса такси.

## Установка

```bash
npm install
```

## Запуск

### Development режим

```bash
npm start
```

Приложение будет доступно по адресу http://localhost:3000

### Production сборка

```bash
npm run build
```

Собранные файлы будут в папке `build/`

## Структура проекта

```
src/
├── components/         # Переиспользуемые компоненты
│   ├── Layout.js      # Основной layout
│   └── ProtectedRoute.js  # Защищенные маршруты
├── context/           # React Context
│   └── AuthContext.js # Контекст аутентификации
├── pages/             # Страницы приложения
│   ├── Login.js
│   ├── Register.js
│   ├── customer/      # Кабинет заказчика
│   ├── driver/        # Кабинет водителя
│   └── admin/         # Кабинет админа
├── services/          # API сервисы
│   ├── api.js         # Axios instance
│   └── auth.js        # Аутентификация
├── styles/            # CSS стили
└── App.js             # Главный компонент
```

## Особенности

### PWA функционал

- Приложение можно установить на домашний экран
- Service Worker для кеширования
- Работает как нативное приложение

### Аутентификация

- JWT токены
- Автоматическое обновление токенов
- Защищенные маршруты по ролям

### Роли пользователей

- **admin** - Полный доступ к панели администратора
- **driver** - Доступ к кабинету водителя
- **customer** - Доступ к кабинету заказчика

## API

Backend API должен быть запущен по адресу http://localhost:8000

Для изменения адреса API создайте файл `.env`:

```
REACT_APP_API_URL=http://your-api-url.com/api
```

## Тестовые учетные данные

После запуска backend и выполнения команды `create_initial_data`:

- Админ: `admin` / `admin123`
- Водители: `ivan`, `alexey`, `vitaliy`, `egor` / `[username]123`
- Заказчик: `customer` / `customer123`
