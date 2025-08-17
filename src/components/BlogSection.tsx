import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchPosts } from '@/lib/fetchPosts';
import type { PostCard } from '@/lib/postTypes';
import styles from './BlogSection.module.scss';

export default function BlogSection() {
  const [posts, setPosts] = useState<PostCard[]>([]);
  useEffect(() => {
    fetchPosts().then((p) => setPosts(p.slice(0, 3)));
  }, []);

  const imgSet = (cover: string) => {
    const base = cover.replace(/\.(jpg|png)$/i, '');
    return {
      webp: `${base}-1024.webp 1024w, ${base}-1440.webp 1440w, ${base}-1920.webp 1920w`,
      jpg: `${base}-1024.jpg`,
    };
  };

  return (
    <section className={styles.wrap} id="blog">
      <div className={styles.head}>
        <div>
          <h2>Блог клиники</h2>
          <p>Разбираем причины боли в спине, делимся практикой реабилитации.</p>
        </div>
        <Link to="/blog" className={styles.more}>
          Все статьи
        </Link>
      </div>
      <div className={styles.grid}>
        {posts.map((p) => (
          <Link key={p.id} className={styles.card} to={`/blog/${p.slug}`}>
            <div className={styles.thumb}>
              {p.cover ? (
                <picture>
                  <source srcSet={imgSet(p.cover).webp} type="image/webp" />
                  <img src={imgSet(p.cover).jpg} alt={p.title} loading="lazy" />
                </picture>
              ) : (
                <div className={styles.placeholder} />
              )}
            </div>
            <div className={styles.body}>
              <h3>{p.title}</h3>
              <p className={styles.excerpt}>{p.excerpt}</p>
              <div className={styles.meta}>
                <span>{new Date(p.date).toLocaleDateString('ru-RU')}</span>
                {p.tags?.length ? <span> • {p.tags[0]}</span> : null}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
