import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { fetchPosts } from '@/lib/fetchPosts';
import type { PostCard } from '@/lib/postTypes';
import styles from './BlogSection.module.scss';

export default function BlogSection() {
  const [posts, setPosts] = useState<PostCard[] | null>(null);

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const p = await fetchPosts();
        if (!ignore) setPosts(p.slice(0, 3));
      } catch {
        if (!ignore) setPosts([]);
      }
    })();
    return () => {
      ignore = true;
    };
  }, []);

  const imgSet = useCallback((cover: string) => {
    // убираем расширение .jpg/.jpeg/.png/.webp
    const m = cover.match(/(.*)\.(jpe?g|png|webp)$/i);
    const base = m ? m[1] : cover;

    return {
      webp:
        `${base}-1024.webp 1024w, ` +
        `${base}-1440.webp 1440w, ` +
        `${base}-1920.webp 1920w`,
      // оставляем jpg как «базу» (если у тебя есть -1440/-1920.jpg, можешь добавить и их)
      jpg: `${base}-1024.jpg`,
    };
  }, []);

  // оценка ширины карточки для sizes
  const SIZES =
    '(min-width: 1200px) 360px, ' + // на контейнере 1180px обычно 3 колонки
    '(min-width: 880px) 45vw, ' + // 2–3 колонки в промежутке
    '100vw'; // мобильные

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
        {(posts ?? Array.from({ length: 3 })).map((p: any, i: number) =>
          posts ? (
            <Link
              key={p.id}
              className={styles.card}
              to={`/blog/${p.slug}`}
              aria-label={`Открыть статью: ${p.title}`}
            >
              <div className={styles.thumb}>
                {p.cover ? (
                  <picture>
                    <source
                      srcSet={imgSet(p.cover).webp}
                      sizes={SIZES}
                      type="image/webp"
                    />
                    <img
                      src={imgSet(p.cover).jpg}
                      alt={p.title}
                      loading="lazy"
                      decoding="async"
                      sizes={SIZES}
                    />
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
          ) : (
            // скелетон во время загрузки
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
