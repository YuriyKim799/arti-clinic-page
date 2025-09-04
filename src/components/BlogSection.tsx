import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { fetchPosts } from '@/lib/fetchPosts';
import type { PostCard } from '@/lib/postTypes';
import styles from './BlogSection.module.scss';

function formatRuDate(iso?: string): string | null {
  if (!iso) return null;
  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(iso) ? `${iso}T00:00:00` : iso;
  const d = new Date(normalized);
  return Number.isNaN(d.getTime()) ? null : d.toLocaleDateString('ru-RU');
}

// Простейший нормалайзер: webp/avif -> jpg
const toPlain = (cover: string) =>
  /^https?:\/\//i.test(cover)
    ? cover
    : cover.replace(/\.(avif|webp)$/i, '.jpg');

function PlainCover({ cover, alt }: { cover: string; alt: string }) {
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
      className={styles.image}
    />
  );
}

export default function BlogSection() {
  const [posts, setPosts] = useState<PostCard[] | null>(null);

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const p = await fetchPosts();
        if (!ignore) setPosts((Array.isArray(p) ? p : []).slice(0, 3));
      } catch {
        if (!ignore) setPosts([]);
      }
    })();
    return () => {
      ignore = true;
    };
  }, []);

  const items = useMemo(() => posts ?? Array.from({ length: 3 }), [posts]);

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
        {items.map((p: any, i: number) =>
          posts ? (
            <Link
              key={p.slug || p.url || i}
              className={styles.card}
              to={`/blog/${p.slug}/`}
              aria-label={`Открыть статью: ${p.title}`}
            >
              <div className={styles.thumb}>
                {p.cover ? (
                  <PlainCover cover={p.cover} alt={p.title} />
                ) : (
                  <div className={styles.placeholder} />
                )}
              </div>

              <div className={styles.body}>
                <h3 className={styles.cardTitle}>{p.title}</h3>
                <p className={styles.excerpt}>{p.excerpt}</p>
                <div className={styles.meta}>
                  {formatRuDate(p.date) && <span>{formatRuDate(p.date)}</span>}
                  {p.tags?.length ? <span> • {p.tags[0]}</span> : null}
                </div>
              </div>
            </Link>
          ) : (
            <div
              key={`s-${i}`}
              className={`${styles.card} ${styles.skeleton}`}
              aria-hidden="true"
            >
              <div className={styles.thumb} />
              <div className={styles.body}>
                <div className={styles.lineLg} />
                <div className={styles.lineSm} />
                <div className={styles.lineXs} />
              </div>
            </div>
          )
        )}
      </div>
    </section>
  );
}
