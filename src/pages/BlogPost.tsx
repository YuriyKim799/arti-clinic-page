import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchPosts, fetchPostHtml } from '@/lib/fetchPosts';
import type { PostCard } from '@/lib/postTypes';
import './BlogPost.scss';
import { NavBar } from '@/components/NavBar';
import { Footer } from '@/components/Footer';
import SeoAuto from '@/components/SeoAuto';

type State =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ok'; meta: PostCard; html: string };

function makeAbs(urlOrPath: string, site: string) {
  try {
    return new URL(urlOrPath).toString();
  } catch {
    return new URL(
      urlOrPath.startsWith('/') ? urlOrPath : `/${urlOrPath}`,
      site
    ).toString();
  }
}

/** Если fetchPostHtml вернул полный index.html, вырезаем содержимое <article> */
function extractArticle(html: string): string {
  const m = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
  return m ? m[1] : html; // для старого post.html (без <article>) просто вернём как есть
}

export default function BlogPost() {
  const { slug = '' } = useParams();
  const [state, setState] = useState<State>({ status: 'loading' });
  const site =
    (import.meta.env.VITE_SITE_URL as string) || 'https://articlinic.ru';
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let alive = true;
    setState({ status: 'loading' });

    (async () => {
      const [posts, htmlRaw] = await Promise.all([
        fetchPosts(),
        fetchPostHtml(slug),
      ]);
      if (!alive) return;

      const meta = posts.find((p) => p.slug === slug);
      if (!meta) {
        setState({
          status: 'error',
          message: 'Статья не найдена (нет в списке постов).',
        });
        return;
      }
      if (!htmlRaw) {
        setState({
          status: 'error',
          message: 'Статья не найдена (нет статического HTML).',
        });
        return;
      }

      const html = /<html/i.test(htmlRaw) ? extractArticle(htmlRaw) : htmlRaw;
      setState({ status: 'ok', meta, html });
    })().catch((err) => {
      if (!alive) return;
      setState({
        status: 'error',
        message: err?.message || 'Ошибка загрузки статьи',
      });
    });

    return () => {
      alive = false;
    };
  }, [slug]);

  // Прогрессивные улучшения для вёрстки контента (адаптивность таблиц/iframes/картинок/внешние ссылки)
  useEffect(() => {
    if (state.status !== 'ok') return;
    const root = contentRef.current;
    if (!root) return;

    // Оборачиваем таблицы в скролл-контейнер
    root.querySelectorAll('table').forEach((tb) => {
      const parent = tb.parentElement;
      if (!parent) return;
      if (parent.classList.contains('table-scroll')) return;
      const wrap = document.createElement('div');
      wrap.className = 'table-scroll';
      parent.insertBefore(wrap, tb);
      wrap.appendChild(tb);
    });

    // Iframe → ленивые и с аспектом 16:9
    root.querySelectorAll<HTMLIFrameElement>('iframe').forEach((ifr) => {
      if (!ifr.getAttribute('loading')) ifr.setAttribute('loading', 'lazy');
      if (!ifr.getAttribute('referrerpolicy'))
        ifr.setAttribute('referrerpolicy', 'no-referrer-when-downgrade');
      const p = ifr.parentElement;
      if (!p || p.classList.contains('ratio-16x9')) return;
      const box = document.createElement('div');
      box.className = 'ratio-16x9';
      p.insertBefore(box, ifr);
      box.appendChild(ifr);
    });

    // Картинки → ленивые/async
    root.querySelectorAll<HTMLImageElement>('img').forEach((img) => {
      if (!img.loading) img.loading = 'lazy';
      img.decoding = 'async';
      img.style.maxWidth = '100%';
      img.style.height = 'auto';
    });

    // Внешние ссылки → новая вкладка + защита
    const siteHost = (() => {
      try {
        return new URL(site).host;
      } catch {
        return '';
      }
    })();
    root.querySelectorAll<HTMLAnchorElement>('a[href^="http"]').forEach((a) => {
      try {
        const host = new URL(a.href).host;
        if (host && host !== siteHost) {
          a.target = '_blank';
          a.rel = 'nofollow noopener noreferrer';
        }
      } catch {}
    });
  }, [state.status, site]); // <-- фикс: зависим от status, а не от state.html

  if (state.status === 'loading') {
    return (
      <>
        <NavBar />
        <main className="post-wrap">
          <p>Загружаем статью…</p>
        </main>
        <Footer />
      </>
    );
  }

  if (state.status === 'error') {
    const og404 = `${site}/og/404-1200x630.jpg`;
    return (
      <>
        <SeoAuto
          title="Статья не найдена — Arti Clinic"
          description="К сожалению, такой страницы нет. Вернитесь к списку статей."
          robots="noindex, nofollow"
          images={{
            url: og404,
            width: 1200,
            height: 630,
            alt: 'Статья не найдена',
            type: 'image/jpeg',
          }}
        />
        <NavBar />
        <main className="post-wrap">
          <h1>Статья не найдена</h1>
          <p>{state.message}</p>
          <p>
            <Link to="/blog">← Вернуться к списку статей</Link>
          </p>
          <noscript>
            <p>
              Откройте статическую версию:{' '}
              <a href={`/blog/${slug}/`}>/blog/{slug}/</a>
            </p>
          </noscript>
        </main>
        <Footer />
      </>
    );
  }

  // status: 'ok'
  const { meta, html } = state;
  const title = meta.title;
  const desc = meta.excerpt || 'Статья блога Arti Clinic';
  const canonical = meta.url
    ? makeAbs(meta.url, site)
    : `${site}/blog/${slug}/`;

  // Если cover локальный (/blog/<slug>/...), для соцсетей предпочитаем og.jpg
  const isLocalCover = !!meta.cover && meta.cover.startsWith(`/blog/${slug}/`);
  const ogImage = isLocalCover
    ? makeAbs(`/blog/${slug}/og.jpg`, site)
    : meta.cover
    ? makeAbs(meta.cover, site)
    : `${site}/og/post-default-1200x630.jpg`;

  const publishedISO = meta.date
    ? new Date(meta.date).toISOString()
    : undefined;
  const modifiedISO = meta.updated
    ? new Date(meta.updated).toISOString()
    : publishedISO;

  const articleLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description: desc,
    datePublished: publishedISO,
    dateModified: modifiedISO,
    image: ogImage ? [ogImage] : undefined,
    author: { '@type': 'Organization', name: 'Arti Clinic' },
    publisher: { '@type': 'Organization', name: 'Arti Clinic' },
    mainEntityOfPage: canonical,
  };

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Главная', item: `${site}/` },
      { '@type': 'ListItem', position: 2, name: 'Блог', item: `${site}/blog` },
      { '@type': 'ListItem', position: 3, name: title, item: canonical },
    ],
  };

  return (
    <>
      <SeoAuto
        title={`${title} — Arti Clinic`}
        description={desc}
        canonical={canonical}
        images={{
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title,
          type: 'image/jpeg',
        }}
        ogType="article"
        articleMeta={{
          publishedTime: publishedISO,
          modifiedTime: modifiedISO,
          tags: meta.tags,
        }}
        jsonLd={[articleLd, breadcrumbLd]}
        twitterCard="summary_large_image"
      />

      <NavBar />
      <main className="post-wrap">
        <article className="post">
          <header className="post-header">
            <nav className="breadcrumbs" aria-label="Хлебные крошки">
              <Link to="/">Главная</Link>
              <span className="sep">·</span>
              <Link to="/blog">Блог</Link>
              <span className="sep">·</span>
              <span aria-current="page">{title}</span>
            </nav>

            <h1 className="post-title">{title}</h1>
            <div className="post-meta">
              {meta.date && (
                <time dateTime={meta.date}>
                  {new Date(meta.date).toLocaleDateString('ru-RU')}
                </time>
              )}
              {meta.tags?.[0] && (
                <span className="tag-dot"> • {meta.tags[0]}</span>
              )}
            </div>

            {/* Хиро-обложку можно вернуть позже; сейчас оставим только контент */}
          </header>

          <div
            ref={contentRef}
            className="post-content"
            // сюда кладём только содержимое <article> из index.html
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </article>

        <noscript>
          <p>
            Статическая версия статьи:{' '}
            <a href={`/blog/${slug}/`}>/blog/{slug}/</a>
          </p>
        </noscript>
      </main>
      <Footer />
    </>
  );
}
