// import React, { useEffect, useState, useCallback } from 'react';
// import { Link } from 'react-router-dom';
// import { fetchPosts } from '@/lib/fetchPosts';
// import type { PostCard } from '@/lib/postTypes';
// import styles from './BlogSection.module.scss';

// export default function BlogSection() {
//   const [posts, setPosts] = useState<PostCard[] | null>(null);

//   useEffect(() => {
//     let ignore = false;
//     (async () => {
//       try {
//         const p = await fetchPosts();
//         if (!ignore) setPosts(p.slice(0, 3));
//       } catch {
//         if (!ignore) setPosts([]);
//       }
//     })();
//     return () => {
//       ignore = true;
//     };
//   }, []);

//   // Новый генератор srcset под наш билдер: -960/-1280/-1600, AVIF + WebP
//   const imgSet = useCallback((cover: string) => {
//     // если обложка внешняя (http/https) — не трогаем
//     const isExternal = /^https?:\/\//i.test(cover);
//     if (isExternal) {
//       return {
//         avif: '',
//         webp: '',
//         fallback: cover,
//       };
//     }

//     // убираем расширение .jpg/.jpeg/.png/.webp/.avif
//     const base = cover.replace(/\.(jpe?g|png|webp|avif)$/i, '');

//     return {
//       avif: `${base}-960.avif 960w, ${base}-1280.avif 1280w, ${base}-1600.avif 1600w`,
//       webp: `${base}-960.webp 960w, ${base}-1280.webp 1280w, ${base}-1600.webp 1600w`,
//       // разумный дефолт — средний webp, он точно сгенерен
//       fallback: `${base}-1280.webp`,
//     };
//   }, []);

//   // оценка ширины карточки для sizes
//   const SIZES =
//     '(min-width: 1200px) 360px, ' + // при 3 колонках ~360px
//     '(min-width: 880px) 45vw, ' + // 2 колонки
//     '100vw'; // мобильные

//   return (
//     <section className={styles.wrap} id="blog">
//       <div className={styles.head}>
//         <div>
//           <h2>Блог клиники</h2>
//           <p>Разбираем причины боли в спине, делимся практикой реабилитации.</p>
//         </div>
//         <Link to="/blog" className={styles.more}>
//           Все статьи
//         </Link>
//       </div>

//       <div className={styles.grid}>
//         {(posts ?? Array.from({ length: 3 })).map((p: any, i: number) =>
//           posts ? (
//             <Link
//               key={p.slug || p.url}
//               className={styles.card}
//               // хвостовой слэш гарантирует раздачу /blog/<slug>/index.html на статиках
//               to={`/blog/${p.slug}/`}
//               aria-label={`Открыть статью: ${p.title}`}
//             >
//               <div className={styles.thumb}>
//                 {p.cover ? (
//                   /^https?:\/\//i.test(p.cover) ? (
//                     // внешний cover — без picture
//                     <img
//                       src={p.cover}
//                       alt={p.title}
//                       loading="lazy"
//                       decoding="async"
//                       sizes={SIZES}
//                     />
//                   ) : (
//                     // локальный cover — AVIF+WebP и новые брейки
//                     <picture>
//                       <source
//                         srcSet={imgSet(p.cover).avif}
//                         sizes={SIZES}
//                         type="image/avif"
//                       />
//                       <source
//                         srcSet={imgSet(p.cover).webp}
//                         sizes={SIZES}
//                         type="image/webp"
//                       />
//                       <img
//                         src={imgSet(p.cover).fallback}
//                         alt={p.title}
//                         loading="lazy"
//                         decoding="async"
//                         sizes={SIZES}
//                       />
//                     </picture>
//                   )
//                 ) : (
//                   <div className={styles.placeholder} />
//                 )}
//               </div>

//               <div className={styles.body}>
//                 <h3>{p.title}</h3>
//                 <p className={styles.excerpt}>{p.excerpt}</p>
//                 <div className={styles.meta}>
//                   {p.date ? (
//                     <span>{new Date(p.date).toLocaleDateString('ru-RU')}</span>
//                   ) : null}
//                   {p.tags?.length ? <span> • {p.tags[0]}</span> : null}
//                 </div>
//               </div>
//             </Link>
//           ) : (
//             // скелетон во время загрузки
//             <div
//               key={`s-${i}`}
//               className={`${styles.card} ${styles.skeleton}`}
//               aria-hidden="true"
//             >
//               <div className={styles.thumb} />
//               <div className={styles.body}>
//                 <div className={styles.lineLg} />
//                 <div className={styles.lineSm} />
//                 <div className={styles.lineXs} />
//               </div>
//             </div>
//           )
//         )}
//       </div>
//     </section>
//   );
// }

// BlogSection.tsx (универсальный)
// ОДИН компонент и для главной (3 поста, шапка, кнопка) и для страницы блога (все посты)

import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchPosts } from '@/lib/fetchPosts';
import type { PostCard } from '@/lib/postTypes';
import styles from './BlogSection.module.scss';

type Props = {
  variant?: 'compact' | 'full'; // compact = как на главной; full = сетка всех постов
  title?: string;
  description?: string;
  limit?: number; // для compact (по умолчанию 3)
  allLinkTo?: string; // куда ведёт "Все статьи"
  backLinkTo?: string; // при full можно показать "← Главная", если надо
  showHeaderInFull?: boolean; // если true — выведем заголовок в режиме full
  className?: string;
};

// --- Утилиты прямо здесь, чтобы не плодить импорты ---
const COVER_SIZES = '(min-width: 1200px) 360px, (min-width: 880px) 45vw, 100vw';

type ImgSource = { type: string; srcSet: string };
type PictureSources = { sources: ImgSource[] | null; fallback: string };

function buildPictureSources(cover: string): PictureSources {
  const isExternal = /^https?:\/\//i.test(cover);
  if (isExternal) {
    return { sources: null, fallback: cover }; // без as const
  }

  const base = cover.replace(/\.(avif|webp|jpe?g|png)$/i, '');
  return {
    sources: [
      {
        type: 'image/avif',
        srcSet: `${base}-960.avif 960w, ${base}-1280.avif 1280w, ${base}-1600.avif 1600w`,
      },
      {
        type: 'image/webp',
        srcSet: `${base}-960.webp 960w, ${base}-1280.webp 1280w, ${base}-1600.webp 1600w`,
      },
    ],
    fallback: cover,
  };
}

function formatRuDate(iso?: string): string | null {
  if (!iso) return null;
  // мобильным движкам не нравится голый YYYY-MM-DD
  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(iso) ? `${iso}T00:00:00` : iso;
  const d = new Date(normalized);
  return Number.isNaN(d.getTime()) ? null : d.toLocaleDateString('ru-RU');
}

function PostCover({
  cover,
  alt,
  sizes = COVER_SIZES,
  className,
}: {
  cover: string;
  alt: string;
  sizes?: string;
  className?: string;
}) {
  const isExternal = /^https?:\/\//i.test(cover);
  if (isExternal) {
    return (
      <img
        src={cover}
        alt={alt}
        loading="lazy"
        decoding="async"
        sizes={sizes}
        className={className}
      />
    );
  }
  const s = buildPictureSources(cover);
  return (
    <picture className={className}>
      {s.sources?.map((src) => (
        <source
          key={src.type}
          type={src.type}
          srcSet={src.srcSet}
          sizes={sizes}
        />
      ))}
      <img
        src={s.fallback}
        alt={alt}
        loading="lazy"
        decoding="async"
        sizes={sizes}
      />
    </picture>
  );
}

// --- Единый компонент ---
export default function BlogSection({
  variant = 'compact',
  title,
  description,
  limit = 3,
  allLinkTo = '/blog',
  backLinkTo,
  showHeaderInFull = false,
  className,
}: Props) {
  const [posts, setPosts] = useState<PostCard[] | null>(null);
  const isCompact = variant === 'compact';

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const p = await fetchPosts();
        if (!ignore) {
          const safe = (Array.isArray(p) ? p : []).filter((x) => !!x?.slug);
          setPosts(safe);
        }
      } catch {
        if (!ignore) setPosts([]);
      }
    })();
    return () => {
      ignore = true;
    };
  }, []);

  const visible = useMemo(() => {
    if (!posts) return null;
    return isCompact ? posts.slice(0, limit) : posts;
  }, [posts, isCompact, limit]);

  return (
    <section
      className={`${styles.wrap} ${className ?? ''}`}
      id={isCompact ? 'blog' : undefined}
    >
      {/* Шапка */}
      {isCompact ? (
        <div className={styles.head}>
          <div>
            <h2>{title ?? 'Блог клиники'}</h2>
            <p>
              {description ??
                'Разбираем причины боли в спине, делимся практикой реабилитации.'}
            </p>
          </div>
          <Link to={allLinkTo} className={styles.more}>
            Все статьи
          </Link>
        </div>
      ) : showHeaderInFull ? (
        <div className={styles.head}>
          <div>
            <h1>{title ?? 'Блог'}</h1>
            {description ? <p>{description}</p> : null}
          </div>
          {backLinkTo ? (
            <Link to={backLinkTo} className={styles.more}>
              ← Главная
            </Link>
          ) : null}
        </div>
      ) : null}

      {/* Сетка карточек */}
      <div className={styles.grid}>
        {(visible ?? Array.from({ length: isCompact ? limit : 6 })).map(
          (p: any, i: number) =>
            visible ? (
              <Link
                key={p.slug || i}
                className={styles.card}
                to={`/blog/${p.slug}/`}
                aria-label={`Открыть статью: ${p.title}`}
              >
                <div className={styles.thumb}>
                  {p.cover ? (
                    <PostCover cover={p.cover} alt={p.title} />
                  ) : (
                    <div className={styles.placeholder} />
                  )}
                </div>

                <div className={styles.body}>
                  <h3 className={styles.cardTitle}>{p.title}</h3>
                  <p className={styles.excerpt}>{p.excerpt}</p>
                  <div className={styles.meta}>
                    {formatRuDate(p.date) && (
                      <span>{formatRuDate(p.date)}</span>
                    )}
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
