# 🚀 Быстрый старт push-уведомлений

## 3 простых шага

### 1️⃣ Установите зависимости

```bash
cd backend
pip install -r requirements.txt
```

### 2️⃣ Сгенерируйте VAPID ключи

```bash
python manage.py generate_vapid_keys
```

Скопируйте выведенные ключи и добавьте их в `backend/.env`:

```env
VAPID_PRIVATE_KEY=ваш_приватный_ключ_из_команды
VAPID_PUBLIC_KEY=ваш_публичный_ключ_из_команды
VAPID_ADMIN_EMAIL=mailto:admin@your-domain.com
```

### 3️⃣ Примените миграции

```bash
python manage.py migrate
```

## Готово! ✅

Теперь запустите приложение:

```bash
# Backend
python manage.py runserver

# Frontend (в другом терминале)
cd ../frontend
npm start
```

## Как проверить?

1. Войдите в приложение
2. Откройте Профиль
3. Нажмите "Включить уведомления"
4. Разрешите уведомления в браузере

Готово! Теперь вы будете получать push-уведомления о новых заказах.

---

**Полная документация:** см. `WEBPUSH_SETUP.md`

**Без Firebase, без сложностей, просто работает! 🎉**
