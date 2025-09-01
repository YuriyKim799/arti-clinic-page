import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { fetchPosts } from '@/lib/fetchPosts';
import type { PostCard } from '@/lib/postTypes';
import { Helmet } from 'react-helmet-async';
import styles from './BlogIndex.module.scss';
import { NavBar } from '@/components/NavBar';
import { Footer } from '@/components/Footer';
import SeoAuto from '@/components/SeoAuto';

export default function BlogIndex() {
  const [posts, setPosts] = useState<PostCard[]>([]);

  useEffect(() => {
    fetchPosts().then((p) => setPosts(Array.isArray(p) ? p : []));
  }, []);

  // Генератор srcset под текущий билдер: -960/-1280/-1600, AVIF+WebP
  const imgSet = useCallback((cover: string) => {
    const isExternal = /^https?:\/\//i.test(cover);
    if (isExternal) {
      return {
        avif: '',
        webp: '',
        fallback: cover,
      };
    }
    const base = cover.replace(/\.(jpe?g|png|webp|avif)$/i, '');
    return {
      avif: `${base}-960.avif 960w, ${base}-1280.avif 1280w, ${base}-1600.avif 1600w`,
      webp: `${base}-960.webp 960w, ${base}-1280.webp 1280w, ${base}-1600.webp 1600w`,
      fallback: `${base}-1280.webp`,
    };
  }, []);

  // ожидаемая ширина карточки (под вашу сетку)
  const SIZES =
    '(min-width: 1200px) 360px, ' + // ~3 колонки
    '(min-width: 880px) 45vw, ' + // 2 колонки
    '100vw'; // мобильные

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

      {/* Дополнительно: RSS-лента */}
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
          {posts.map((p) => {
            const sets = p.cover ? imgSet(p.cover) : null;
            const isExternal = p.cover ? /^https?:\/\//i.test(p.cover) : false;

            return (
              <Link
                key={p.slug || p.url}
                to={`/blog/${p.slug}/`}
                className={styles.card}
                aria-label={`Открыть статью: ${p.title}`}
              >
                {p.cover ? (
                  <div className={styles.pictureWrap}>
                    {isExternal ? (
                      <img
                        src={p.cover}
                        alt={p.title}
                        loading="lazy"
                        decoding="async"
                        className={styles.image}
                        sizes={SIZES}
                      />
                    ) : (
                      <picture className={styles.picture}>
                        <source
                          type="image/avif"
                          srcSet={sets!.avif}
                          sizes={SIZES}
                        />
                        <source
                          type="image/webp"
                          srcSet={sets!.webp}
                          sizes={SIZES}
                        />
                        <img
                          src={sets!.fallback}
                          alt={p.title}
                          loading="lazy"
                          decoding="async"
                          className={styles.image}
                          sizes={SIZES}
                        />
                      </picture>
                    )}
                  </div>
                ) : (
                  <div className={styles.placeholder} />
                )}

                <div className={styles.body}>
                  <h3 className={styles.cardTitle}>{p.title}</h3>
                  <p className={styles.excerpt}>{p.excerpt}</p>
                  <div className={styles.meta}>
                    {p.date ? new Date(p.date).toLocaleDateString('ru-RU') : ''}
                    {p.tags?.length ? <span> • {p.tags[0]}</span> : null}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </main>
      <Footer />
    </>
  );
}
