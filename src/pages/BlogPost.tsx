// src/pages/BlogPost.tsx
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchPosts, fetchPostHtml } from '@/lib/fetchPosts';
import type { PostCard } from '@/lib/postTypes';
import '@/styles/blog-post.scss';
import { NavBar } from '@/components/NavBar';
import { Footer } from '@/components/Footer';
import SeoAuto from '@/components/SeoAuto';

type State =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ok'; meta: PostCard; html: string };

function makeAbs(urlOrPath: string, site: string) {
  // если пришёл абсолютный url — вернём как есть; иначе приклеим к домену
  try {
    const u = new URL(urlOrPath);
    return u.toString();
  } catch {
    return new URL(
      urlOrPath.startsWith('/') ? urlOrPath : `/${urlOrPath}`,
      site
    ).toString();
  }
}

export default function BlogPost() {
  const { slug = '' } = useParams();
  const [state, setState] = useState<State>({ status: 'loading' });

  // домен берём из .env.production
  const site = import.meta.env.VITE_SITE_URL || 'https://articlinic.ru';

  useEffect(() => {
    let alive = true;
    setState({ status: 'loading' });

    (async () => {
      const [posts, html] = await Promise.all([
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
      if (!html) {
        setState({
          status: 'error',
          message: 'Статья не найдена (нет post.html).',
        });
        return;
      }
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
        />
        <NavBar />
        <main className="post-wrap">
          <h1>Статья не найдена</h1>
          <p>{state.message}</p>
          <p>
            <Link to="/blog">← Вернуться к списку статей</Link>
          </p>
        </main>
        <Footer />
      </>
    );
  }

  // ok
  const { meta, html } = state;
  const title = meta.title;
  const desc = meta.excerpt || 'Статья блога Arti Clinic';

  // каноникал: берём из meta.url, иначе /blog/:slug
  const canonical = meta.url ? makeAbs(meta.url, site) : `${site}/blog/${slug}`;

  // абсолютная OG-картинка
  const ogImage = meta.cover ? makeAbs(meta.cover, site) : undefined;

  // для <picture> ниже оставим твою логику с baseCover
  const baseCover = meta.cover?.replace(/\.(jpg|png|webp)$/i, '') || '';

  // JSON-LD: Article
  const articleLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description: desc,
    datePublished: meta.date,
    dateModified: meta.updated ?? meta.date,
    image: ogImage ? [ogImage] : undefined,
    author: { '@type': 'Organization', name: 'Arti Clinic' },
    publisher: { '@type': 'Organization', name: 'Arti Clinic' },
    mainEntityOfPage: canonical,
  };

  // JSON-LD: хлебные крошки
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
        image={ogImage}
        jsonLd={[articleLd, breadcrumbLd]}
        ogType="article"
      />

      <NavBar />
      <main className="post-wrap">
        <article className="post">
          <header className="post-header">
            {/* Хлебные крошки в UI */}
            <nav className="breadcrumbs" aria-label="Хлебные крошки">
              <Link to="/">Главная</Link>
              <span className="sep">·</span>
              <Link to="/blog">Блог</Link>
              <span className="sep">·</span>
              <span aria-current="page">{title}</span>
            </nav>

            <h1>{title}</h1>
            <div className="post-meta">
              {meta.date && (
                <time dateTime={meta.date}>
                  {new Date(meta.date).toLocaleDateString('ru-RU')}
                </time>
              )}
              {meta.tags?.length ? <span> • {meta.tags[0]}</span> : null}
            </div>

            {meta.cover && (
              <picture>
                <source
                  srcSet={`${baseCover}-1024.webp 1024w, ${baseCover}-1440.webp 1440w, ${baseCover}-1920.webp 1920w`}
                  type="image/webp"
                />
                <img src={`${baseCover}-1024.jpg`} alt={title} />
              </picture>
            )}
          </header>

          <div
            className="post-content"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </article>
      </main>
      <Footer />
    </>
  );
}
