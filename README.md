# Arti Clinic — лендинг (React + TypeScript + SCSS Modules)

Современный минималистичный лендинг для медицинского центра **Arti Clinic**.
Цвета — серо-бежевые с мягким голубым акцентом. Плавные анимации при прокрутке без сторонних библиотек (IntersectionObserver).

## Быстрый старт

```bash
npm i
npm run dev
# откройте http://localhost:5173
```

## Структура

- Hero → Benefits → Services → Reviews → Blog → Contact (карта + форма) → Footer

Как публиковать новую статью

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

На главной появится карточка, в /blog — список, в /blog/slug — статья.
Дзен сам подтянет статью из /rss-dzen.xml после модерации.
