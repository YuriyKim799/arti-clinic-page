Как теперь добавлять новую статью

Кладёшь файл в content/posts/ — например gryzha-uprazhnenija.md
Вверху front-matter (минимум):

---

title: "Грыжа: упражнения"
slug: "gryzha-uprazhnenija"
date: "2025-08-18T12:00:00+03:00"
cover: "/blog/gryzha-uprazhnenija/cover.jpg"
tags: ["реабилитация"]

---

Кладёшь оригинал картинки в
public/blog/gryzha-uprazhnenija/cover.jpg

Генеришь адаптивные картинки (быстро и точечно для этой статьи):

npm run build:webp -- --slug=gryzha-uprazhnenija

Генеришь контент (соберёт post.html, posts.json, RSS и sitemap):

npm run build:content

Локально проверить:

список: http://localhost:5173/posts.json

сама статья (готовый HTML):
http://localhost:5173/blog/gryzha-uprazhnenija/post.html

страница: http://localhost:5173/blog/gryzha-uprazhnenija

Что сейчас делает сборка

Для каждого поста создаётся public/blog/<slug>/post.html (а BlogPost.tsx просто загружает этот HTML).

public/posts.json — карточки для списка.

public/rss-dzen.xml — лента для Дзена (с абсолютными ссылками/картинками).

public/sitemap.xml — для поисковиков.

Дзен: как «он сам забирает» по RSS

В Дзен-Студии включи импорт по RSS и укажи:

https://arti-clinic.ru/rss-dzen.xml

После деплоя (см. ниже) новые посты окажутся в ленте — Дзен периодически опрашивает её.
Если нужно сразу — в интерфейсе Дзена есть ручная проверка ленты.

Деплой в Yandex Object Storage (важно)

Включи Static website hosting:

Index document: index.html

Error document: index.html ← это нужно для SPA-роутов /blog/...

Заливать папку dist/ и всё из public/ (Vite сам копирует public/\*\* в dist/).

Для свежести данных поставь заголовки (как умеешь в своём пайплайне):

posts.json, rss-dzen.xml, sitemap.xml, index.html → Cache-Control: no-cache

Быстрый чек после деплоя:

https://arti-clinic.ru/posts.json

https://arti-clinic.ru/blog/<slug>/post.html

https://arti-clinic.ru/rss-dzen.xml

Полезные команды

Прогнать картинки только в одной папке:

npm run build:webp -- --slug=<slug>

Принудительно перегнать всё (если сменил размеры/качество):

npm run build:webp -- --force

Полный цикл “картинки + контент”:

npm run build:seo

Если вдруг что-то пусто

В DevTools → Network проверь статус:

posts.json должен быть 200.

blog/<slug>/post.html должен быть 200.

Если 404 → ещё раз npm run build:content и перезапусти dev-сервер.

Если страница открывается, но мусор в начале текста — это остатки из исходного Markdown. Наш скрипт чистит типичные «Подписаться/Дзен» и пустые [](/path). Если встретится новый шаблон мусора — пришли пару строк, добавим фильтр.
