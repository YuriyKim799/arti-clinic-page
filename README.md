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

Как публиковать новую статью (очень просто)

Клади Markdown сюда:
content/posts/<slug>.md (как в примере).

Картинки — сюда:
public/blog/<slug>/cover.jpg (и любые другие, если нужны).

В терминале:

npm run build:webp # сделает -768/-1024/-1440/-1920 и .webp
npm run build:content # обновит posts.json, rss-dzen.xml, sitemap.xml и post.md
npm run build # обычная сборка Vite

Задеплой статику (см. ниже Yandex Object Storage).

После выката:

# один раз придумай INDEXNOW_KEY и положи его в секреты CI

npm run indexnow

Готово! На главной появится карточка, в /blog — список, в /blog/slug — статья.
Дзен сам подтянет статью из /rss-dzen.xml после модерации.
