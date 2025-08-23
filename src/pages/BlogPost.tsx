// src/pages/BlogPost.tsx
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { fetchPosts, fetchPostHtml } from '@/lib/fetchPosts';
import type { PostCard } from '@/lib/postTypes';
import '@/styles/blog-post.scss';
import { NavBar } from '@/components/NavBar';
import { Footer } from '@/components/Footer';

type State =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ok'; meta: PostCard; html: string };

export default function BlogPost() {
  const { slug = '' } = useParams();
  const [state, setState] = useState<State>({ status: 'loading' });

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
      <main className="post-wrap">
        <p>Загружаем статью…</p>
      </main>
    );
  }

  if (state.status === 'error') {
    return (
      <main className="post-wrap">
        <Helmet>
          <title>Статья не найдена — Arti Clinic</title>
        </Helmet>
        <h1>Статья не найдена</h1>
        <p>{state.message}</p>
        <p>
          <Link to="/blog">← Вернуться к списку статей</Link>
        </p>
      </main>
    );
  }

  // ok
  const { meta, html } = state;
  const title = meta.title;
  const desc = meta.excerpt || 'Статья блога Arti Clinic';
  const url = meta.url;
  const baseCover = meta.cover?.replace(/\.(jpg|png)$/i, '') || '';

  const ld = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    datePublished: meta.date,
    dateModified: meta.date,
    image: meta.cover
      ? [new URL(meta.cover, 'https://arti-clinic.ru').toString()]
      : undefined,
    author: { '@type': 'Organization', name: 'Arti Clinic' },
    publisher: { '@type': 'Organization', name: 'Arti Clinic' },
    mainEntityOfPage: url,
  };

  const origin =
    typeof window !== 'undefined'
      ? window.location.origin
      : 'https://arti-clinic.ru';
  const canonical = meta.url || `${origin}/blog/${slug}`;

  // JSON-LD для хлебных крошек (необязательно, но полезно для SEO)
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Главная', item: `${origin}/` },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Блог',
        item: `${origin}/blog`,
      },
      { '@type': 'ListItem', position: 3, name: title, item: canonical },
    ],
  };

  return (
    <>
      <NavBar />
      <main className="post-wrap">
        <Helmet>
          <title>{title} — Arti Clinic</title>
          <link rel="canonical" href={canonical} />
          <meta name="description" content={desc} />
          <meta property="og:type" content="article" />
          <meta property="og:title" content={`${title} — Arti Clinic`} />
          <meta property="og:description" content={desc} />
          {meta.cover && (
            <meta
              property="og:image"
              content={new URL(meta.cover, origin).toString()}
            />
          )}
          <meta property="og:url" content={canonical} />
          <script type="application/ld+json">{JSON.stringify(ld)}</script>
          {/* хлебные крошки */}
          <script type="application/ld+json">
            {JSON.stringify(breadcrumbLd)}
          </script>
        </Helmet>

        <article className="post">
          <header className="post-header">
            {/* Хлебные крошки */}
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
