import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import matter from 'gray-matter';
import { marked } from 'marked';
import { Helmet } from 'react-helmet-async';
import type { FrontMatter } from '@/lib/postTypes';
import '@/styles/blog-post.scss';

export default function BlogPost() {
  const { slug = '' } = useParams();
  const [raw, setRaw] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const res = await fetch(`/blog/${slug}/post.md`, { cache: 'no-cache' });
      setRaw(res.ok ? await res.text() : null);
    })();
  }, [slug]);

  const { fm, html, text } = useMemo(() => {
    if (!raw) return { fm: null as FrontMatter | null, html: '', text: '' };
    const parsed = matter(raw);
    const data = parsed.data as FrontMatter;
    const html = marked.parse(parsed.content) as string;
    const text = parsed.content.replace(/\s+/g, ' ').trim().slice(0, 180);
    return { fm: data, html, text };
  }, [raw]);

  if (!fm) return null;

  const url = `https://arti-clinic.ru/blog/${fm.slug}`;
  const cover = fm.cover
    ? new URL(fm.cover, 'https://arti-clinic.ru').toString()
    : undefined;
  const title = fm.title || 'Статья';
  const desc = fm.excerpt || text || 'Статья блога Arti Clinic';

  const ld = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    datePublished: fm.date || fm.updated,
    dateModified: fm.updated || fm.date,
    image: cover ? [cover] : undefined,
    author: { '@type': 'Organization', name: 'Arti Clinic' },
    publisher: { '@type': 'Organization', name: 'Arti Clinic' },
    mainEntityOfPage: url,
  };

  return (
    <main className="post-wrap">
      <Helmet>
        <title>{title} — Arti Clinic</title>
        <link rel="canonical" href={url} />
        <meta name="description" content={desc} />
        <meta property="og:type" content="article" />
        <meta property="og:title" content={`${title} — Arti Clinic`} />
        <meta property="og:description" content={desc} />
        {cover && <meta property="og:image" content={cover} />}
        <meta property="og:url" content={url} />
        <script type="application/ld+json">{JSON.stringify(ld)}</script>
      </Helmet>

      <article className="post">
        <header className="post-header">
          <h1>{title}</h1>
          <div className="post-meta">
            {fm.date && (
              <time dateTime={fm.date}>
                {new Date(fm.date).toLocaleDateString('ru-RU')}
              </time>
            )}
            {fm.tags?.length ? <span> • {fm.tags[0]}</span> : null}
          </div>
          {cover && (
            <picture>
              <source
                srcSet={`${cover.replace(
                  /\.(jpg|png)$/i,
                  ''
                )}-1024.webp 1024w, ${cover.replace(
                  /\.(jpg|png)$/i,
                  ''
                )}-1440.webp 1440w, ${cover.replace(
                  /\.(jpg|png)$/i,
                  ''
                )}-1920.webp 1920w`}
                type="image/webp"
              />
              <img
                src={`${cover.replace(/\.(jpg|png)$/i, '')}-1024.jpg`}
                alt={title}
              />
            </picture>
          )}
        </header>
        <div
          className="post-content"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </article>
    </main>
  );
}
