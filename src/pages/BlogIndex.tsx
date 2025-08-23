import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchPosts } from '@/lib/fetchPosts';
import type { PostCard } from '@/lib/postTypes';
import { Helmet } from 'react-helmet-async';
import styles from './BlogIndex.module.scss';
import { NavBar } from '@/components/NavBar';
import { Footer } from '@/components/Footer';

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

  return (
    <>
      <NavBar />
      <main className={styles.main}>
        <Helmet>
          <title>Блог — Arti Clinic</title>
          <link rel="canonical" href="https://arti-clinic.ru/blog" />
          <meta
            name="description"
            content="Статьи о неврологии, грыжах дисков, реабилитации."
          />
          <link
            rel="alternate"
            type="application/rss+xml"
            href="/rss-dzen.xml"
          />
        </Helmet>

        {/* Ссылка на Главную c якорем на блок #blog */}
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
