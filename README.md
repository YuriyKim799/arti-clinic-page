
# Arti Clinic — лендинг (React + TypeScript + SCSS Modules)

Современный минималистичный лендинг для медицинского центра **Arti Clinic**.
Цвета — серо-бежевые с мягким голубым акцентом. Плавные анимации при прокрутке без сторонних библиотек (IntersectionObserver).

## Быстрый старт
```bash
npm i
npm run dev
# откройте http://localhost:5173
```

## Где настраивать
- **Кнопки мессенджеров:** замените ссылки в `Hero.tsx` и в форме `Contact.tsx`.
- **Карта:** замените `src` у iframe (Yandex) на вашу конструктор‑ссылку с координатами.
- **Тексты и услуги:** правьте массивы данных в `Benefits.tsx`, `Services.tsx`, `Reviews.tsx`, `Blog.tsx`.
- **Цвета/скругления:** `src/styles/_variables.scss`.
- **Форма:** сейчас заглушка `setTimeout`. Подключите ваш API/Telegram Bot в `Contact.tsx`.

## Структура
- Hero → Benefits → Services → Reviews → Blog → Contact (карта + форма) → Footer

