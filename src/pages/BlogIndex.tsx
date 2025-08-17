import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchPosts } from '@/lib/fetchPosts';
import type { PostCard } from '@/lib/postTypes';
import { Helmet } from 'react-helmet-async';

export default function BlogIndex() {
  const [posts, setPosts] = useState<PostCard[]>([]);
  useEffect(() => {
    fetchPosts().then(setPosts);
  }, []);

  const imgSrc = (cover: string) => {
    const base = cover.replace(/\.(jpg|png)$/i, '');
    return {
      webp: `${base}-768.webp 768w, ${base}-1024.webp 1024w`,
      jpg: `${base}-768.jpg`,
    };
  };

  return (
    <main style={{ maxWidth: 1180, margin: '0 auto', padding: '40px 20px' }}>
      <Helmet>
        <title>Блог — Arti Clinic</title>
        <link rel="canonical" href="https://arti-clinic.ru/blog" />
        <meta
          name="description"
          content="Статьи о неврологии, грыжах дисков, реабилитации."
        />
        <link rel="alternate" type="application/rss+xml" href="/rss-dzen.xml" />
      </Helmet>
      <h1
        style={{
          fontSize: '36px',
          letterSpacing: '-0.02em',
          margin: '0 0 20px',
        }}
      >
        Блог
      </h1>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))',
          gap: 20,
        }}
      >
        {posts.map((p) => (
          <Link
            key={p.id}
            to={`/blog/${p.slug}`}
            style={{
              textDecoration: 'none',
              color: 'inherit',
              border: '1px solid #e6e3de',
              borderRadius: 16,
              overflow: 'hidden',
              background: '#fff',
            }}
          >
            {p.cover && (
              <picture>
                <source srcSet={imgSrc(p.cover).webp} type="image/webp" />
                <img
                  src={imgSrc(p.cover).jpg}
                  alt={p.title}
                  loading="lazy"
                  style={{ width: '100%', height: 180, objectFit: 'cover' }}
                />
              </picture>
            )}
            <div style={{ padding: 16 }}>
              <h3 style={{ margin: '0 0 8px' }}>{p.title}</h3>
              <p style={{ color: '#6b6b6b' }}>{p.excerpt}</p>
              <div style={{ color: '#6b6b6b', fontSize: 14, marginTop: 8 }}>
                {new Date(p.date).toLocaleDateString('ru-RU')}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
