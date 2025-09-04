import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { fetchPosts } from '@/lib/fetchPosts';
import type { PostCard } from '@/lib/postTypes';
import { Helmet } from 'react-helmet-async';
import { NavBar } from '@/components/NavBar';
import { Footer } from '@/components/Footer';
import SeoAuto from '@/components/SeoAuto';
import styles from './BlogIndex.module.scss';

function formatRuDate(iso?: string): string | null {
  if (!iso) return null;
  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(iso) ? `${iso}T00:00:00` : iso;
  const d = new Date(normalized);
  return Number.isNaN(d.getTime()) ? null : d.toLocaleDateString('ru-RU');
}

const toPlain = (cover: string) =>
  /^https?:\/\//i.test(cover)
    ? cover
    : cover.replace(/\.(avif|webp)$/i, '.jpg');

function PlainCover({
  cover,
  alt,
  className,
}: {
  cover: string;
  alt: string;
  className?: string;
}) {
  const [src, setSrc] = useState(toPlain(cover));
  useEffect(() => setSrc(toPlain(cover)), [cover]);

  const onError = useCallback(() => {
    if (/\.jpg$/i.test(src)) {
      setSrc(src.replace(/\.jpg$/i, '.jpeg'));
      return;
    }
    if (/\.jpeg$/i.test(src)) {
      setSrc(src.replace(/\.jpeg$/i, '.png'));
      return;
    }
  }, [src]);

  return (
    <img
      src={src}
      alt={alt}
      onError={onError}
      loading="lazy"
      decoding="async"
      className={className}
    />
  );
}

export default function BlogIndex() {
  const [posts, setPosts] = useState<PostCard[]>([]);
  useEffect(() => {
    fetchPosts().then((p) =>
      setPosts(Array.isArray(p) ? p.filter((x) => !!x?.slug) : [])
    );
  }, []);

  const site = import.meta.env.VITE_SITE_URL || 'https://articlinic.ru';

  return (
    <>
      <SeoAuto
        title="Блог Arti Clinic — статьи о болях в спине, грыжах, рефлексотерапии"
        description="Полезные статьи: когда операция не нужна, как помогает ЛФК и рефлексотерапия, советы по профилактике боли в спине."
        images={{
          url: `${site}/og/blog-1200x630.jpg`,
          width: 1200,
          height: 630,
          alt: 'Блог Arti Clinic',
          type: 'image/jpeg',
        }}
        jsonLd={[
          {
            '@context': 'https://schema.org',
            '@type': 'Blog',
            name: 'Блог Arti Clinic',
            url: `${site}/blog`,
          },
          {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              {
                '@type': 'ListItem',
                position: 1,
                name: 'Главная',
                item: `${site}/`,
              },
              {
                '@type': 'ListItem',
                position: 2,
                name: 'Блог',
                item: `${site}/blog`,
              },
            ],
          },
        ]}
      />
      <Helmet>
        <link rel="alternate" type="application/rss+xml" href="/rss-dzen.xml" />
      </Helmet>

      <NavBar />
      <main className={styles.main}>
        <div className={styles.top}>
          <Link to="/#blog" className={styles.backLink}>
            ← Главная
          </Link>
        </div>

        <h1 className={styles.title}>Блог</h1>

        <div className={styles.grid}>
          {posts.map((p) => (
            <Link
              key={p.slug}
              to={`/blog/${p.slug}/`}
              className={styles.card}
              aria-label={`Открыть статью: ${p.title}`}
            >
              {p.cover ? (
                <div className={styles.pictureWrap}>
                  <PlainCover
                    cover={p.cover}
                    alt={p.title}
                    className={styles.image}
                  />
                </div>
              ) : (
                <div className={styles.placeholder} />
              )}

              <div className={styles.body}>
                <h3 className={styles.cardTitle}>{p.title}</h3>
                <p className={styles.excerpt}>{p.excerpt}</p>
                <div className={styles.meta}>
                  {formatRuDate(p.date) || ''}
                  {p.tags?.length ? <span> • {p.tags[0]}</span> : null}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
}
