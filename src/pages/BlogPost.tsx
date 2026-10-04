import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchPosts, fetchPostHtml } from '@/lib/fetchPosts';
import type { PostCard } from '@/lib/postTypes';
import './BlogPost.scss';
import { NavBar } from '@/components/NavBar';
import { Footer } from '@/components/Footer';
import SeoAuto from '@/components/SeoAuto';
import { CLINIC_SHARE_IMAGE, SITE_ORIGIN } from '@/data/clinic';
import { relatedServicesForText } from '@/data/seoTopics';

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
function extractArticle(html: string, title: string): string {
  const m = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
  const doc = new DOMParser().parseFromString(m ? m[1] : html, 'text/html');
  const heading = doc.querySelector('h1');
  const normalize = (text: string) => text.toLocaleLowerCase('ru-RU')
    .replace(/[^\p{L}\p{N}]/gu, '');
  if (heading) {
    if (normalize(heading.textContent || '') === normalize(title)) {
      heading.remove();
    } else {
      // Keep a distinct article heading as a subsection below the page title.
      const subheading = doc.createElement('h2');
      subheading.innerHTML = heading.innerHTML;
      heading.replaceWith(subheading);
    }
  }
  return doc.body.innerHTML;
}

export default function BlogPost() {
  const { slug = '' } = useParams();
  const [state, setState] = useState<State>({ status: 'loading' });
  const site = SITE_ORIGIN;
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

      const html = extractArticle(htmlRaw, meta.title);
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
          a.rel = [...new Set([...a.rel.split(/\s+/).filter(Boolean), 'noopener', 'noreferrer'])].join(' ');
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
    return (
      <>
        <SeoAuto
          title="Статья не найдена — Arti Clinic"
          description="К сожалению, такой страницы нет. Вернитесь к списку статей."
          robots="noindex, nofollow"
          images={CLINIC_SHARE_IMAGE}
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
  const relatedServices = relatedServicesForText([title, ...(meta.tags || [])].join(' '));
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
    : makeAbs(CLINIC_SHARE_IMAGE.url, site);

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
    author: { '@type': 'Organization', name: 'Арти Клиник', url: `${site}/` },
    publisher: {
      '@type': 'Organization',
      name: 'Арти Клиник',
      url: `${site}/`,
      logo: { '@type': 'ImageObject', url: `${site}/images/clinic-logo.png` },
    },
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
        title={`${title} — Арти Клиник`}
        description={desc}
        canonical={canonical}
        images={{
          url: ogImage,
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
          <nav className="post-links" aria-label="Информация о клинике">
            {relatedServices.map(({ href, label }) => <Link key={href} to={href}>{label}</Link>)}
            <Link to="/services">Услуги клиники</Link>
            <Link to="/price-list">Цены на консультации и лечение</Link>
            {meta.source && /^https:\/\/(?:www\.)?dzen\.ru\//i.test(meta.source) && (
              <a href={meta.source} target="_blank" rel="noopener noreferrer">Источник: Дзен</a>
            )}
          </nav>
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
