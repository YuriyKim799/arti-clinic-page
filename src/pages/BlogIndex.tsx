import React, { useEffect, useState } from 'react';
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
    fetchPosts().then(setPosts);
  }, []);

  const imgSrc = (cover: string) => {
    const base = cover.replace(/\.(jpe?g|png)$/i, '');
    return {
      webp: `${base}-768.webp 768w, ${base}-1024.webp 1024w`,
      jpg: `${base}-768.jpg`,
    };
  };

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
          {posts.map((p) => (
            <Link key={p.id} to={`/blog/${p.slug}`} className={styles.card}>
              {p.cover && (
                <picture className={styles.picture}>
                  <source srcSet={imgSrc(p.cover).webp} type="image/webp" />
                  <img
                    src={imgSrc(p.cover).jpg}
                    alt={p.title}
                    loading="lazy"
                    className={styles.image}
                  />
                </picture>
              )}
              <div className={styles.body}>
                <h3 className={styles.cardTitle}>{p.title}</h3>
                <p className={styles.excerpt}>{p.excerpt}</p>
                <div className={styles.meta}>
                  {new Date(p.date).toLocaleDateString('ru-RU')}
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
