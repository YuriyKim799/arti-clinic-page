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

  // Новый генератор srcset под наш билдер: -960/-1280/-1600, AVIF + WebP
  const imgSet = useCallback((cover: string) => {
    // если обложка внешняя (http/https) — не трогаем
    const isExternal = /^https?:\/\//i.test(cover);
    if (isExternal) {
      return {
        avif: '',
        webp: '',
        fallback: cover,
      };
    }

    // убираем расширение .jpg/.jpeg/.png/.webp/.avif
    const base = cover.replace(/\.(jpe?g|png|webp|avif)$/i, '');

    return {
      avif: `${base}-960.avif 960w, ${base}-1280.avif 1280w, ${base}-1600.avif 1600w`,
      webp: `${base}-960.webp 960w, ${base}-1280.webp 1280w, ${base}-1600.webp 1600w`,
      // разумный дефолт — средний webp, он точно сгенерен
      fallback: `${base}-1280.webp`,
    };
  }, []);

  // оценка ширины карточки для sizes
  const SIZES =
    '(min-width: 1200px) 360px, ' + // при 3 колонках ~360px
    '(min-width: 880px) 45vw, ' + // 2 колонки
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
              key={p.slug || p.url}
              className={styles.card}
              // хвостовой слэш гарантирует раздачу /blog/<slug>/index.html на статиках
              to={`/blog/${p.slug}/`}
              aria-label={`Открыть статью: ${p.title}`}
            >
              <div className={styles.thumb}>
                {p.cover ? (
                  /^https?:\/\//i.test(p.cover) ? (
                    // внешний cover — без picture
                    <img
                      src={p.cover}
                      alt={p.title}
                      loading="lazy"
                      decoding="async"
                      sizes={SIZES}
                    />
                  ) : (
                    // локальный cover — AVIF+WebP и новые брейки
                    <picture>
                      <source
                        srcSet={imgSet(p.cover).avif}
                        sizes={SIZES}
                        type="image/avif"
                      />
                      <source
                        srcSet={imgSet(p.cover).webp}
                        sizes={SIZES}
                        type="image/webp"
                      />
                      <img
                        src={imgSet(p.cover).fallback}
                        alt={p.title}
                        loading="lazy"
                        decoding="async"
                        sizes={SIZES}
                      />
                    </picture>
                  )
                ) : (
                  <div className={styles.placeholder} />
                )}
              </div>

              <div className={styles.body}>
                <h3>{p.title}</h3>
                <p className={styles.excerpt}>{p.excerpt}</p>
                <div className={styles.meta}>
                  {p.date ? (
                    <span>{new Date(p.date).toLocaleDateString('ru-RU')}</span>
                  ) : null}
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
