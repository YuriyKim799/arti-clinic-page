// import React, { useEffect, useState } from 'react';
// import { useParams, Link } from 'react-router-dom';
// import { fetchPosts, fetchPostHtml } from '@/lib/fetchPosts';
// import type { PostCard } from '@/lib/postTypes';
// import '@/styles/blog-post.scss';
// import { NavBar } from '@/components/NavBar';
// import { Footer } from '@/components/Footer';
// import SeoAuto from '@/components/SeoAuto';

// type State =
//   | { status: 'loading' }
//   | { status: 'error'; message: string }
//   | { status: 'ok'; meta: PostCard; html: string };

// function makeAbs(urlOrPath: string, site: string) {
//   try {
//     return new URL(urlOrPath).toString();
//   } catch {
//     return new URL(
//       urlOrPath.startsWith('/') ? urlOrPath : `/${urlOrPath}`,
//       site
//     ).toString();
//   }
// }

// export default function BlogPost() {
//   const { slug = '' } = useParams();
//   const [state, setState] = useState<State>({ status: 'loading' });
//   const site = import.meta.env.VITE_SITE_URL || 'https://articlinic.ru';

//   useEffect(() => {
//     let alive = true;
//     setState({ status: 'loading' });
//     (async () => {
//       const [posts, html] = await Promise.all([
//         fetchPosts(),
//         fetchPostHtml(slug),
//       ]);
//       if (!alive) return;

//       const meta = posts.find((p) => p.slug === slug);
//       if (!meta)
//         return setState({
//           status: 'error',
//           message: 'Статья не найдена (нет в списке постов).',
//         });
//       if (!html)
//         return setState({
//           status: 'error',
//           message: 'Статья не найдена (нет post.html).',
//         });
//       setState({ status: 'ok', meta, html });
//     })().catch((err) => {
//       if (!alive) return;
//       setState({
//         status: 'error',
//         message: err?.message || 'Ошибка загрузки статьи',
//       });
//     });
//     return () => {
//       alive = false;
//     };
//   }, [slug]);

//   if (state.status === 'loading') {
//     return (
//       <>
//         <NavBar />
//         <main className="post-wrap">
//           <p>Загружаем статью…</p>
//         </main>
//         <Footer />
//       </>
//     );
//   }

//   if (state.status === 'error') {
//     const og404 = `${site}/og/404-1200x630.jpg`;
//     return (
//       <>
//         <SeoAuto
//           title="Статья не найдена — Arti Clinic"
//           description="К сожалению, такой страницы нет. Вернитесь к списку статей."
//           robots="noindex, nofollow"
//           images={{
//             url: og404,
//             width: 1200,
//             height: 630,
//             alt: 'Статья не найдена',
//             type: 'image/jpeg',
//           }}
//         />
//         <NavBar />
//         <main className="post-wrap">
//           <h1>Статья не найдена</h1>
//           <p>{state.message}</p>
//           <p>
//             <Link to="/blog">← Вернуться к списку статей</Link>
//           </p>
//         </main>
//         <Footer />
//       </>
//     );
//   }

//   // ok
//   const { meta, html } = state;
//   const title = meta.title;
//   const desc = meta.excerpt || 'Статья блога Arti Clinic';
//   const canonical = meta.url ? makeAbs(meta.url, site) : `${site}/blog/${slug}`;
//   const ogImage = meta.cover
//     ? makeAbs(meta.cover, site)
//     : `${site}/og/post-default-1200x630.jpg`;
//   const baseCover = meta.cover?.replace(/\.(jpg|png|webp)$/i, '') || '';

//   const publishedISO = meta.date
//     ? new Date(meta.date).toISOString()
//     : undefined;
//   const modifiedISO = meta.updated
//     ? new Date(meta.updated).toISOString()
//     : publishedISO;

//   const articleLd = {
//     '@context': 'https://schema.org',
//     '@type': 'Article',
//     headline: title,
//     description: desc,
//     datePublished: publishedISO,
//     dateModified: modifiedISO,
//     image: ogImage ? [ogImage] : undefined,
//     author: { '@type': 'Organization', name: 'Arti Clinic' },
//     publisher: { '@type': 'Organization', name: 'Arti Clinic' },
//     mainEntityOfPage: canonical,
//   };

//   const breadcrumbLd = {
//     '@context': 'https://schema.org',
//     '@type': 'BreadcrumbList',
//     itemListElement: [
//       { '@type': 'ListItem', position: 1, name: 'Главная', item: `${site}/` },
//       { '@type': 'ListItem', position: 2, name: 'Блог', item: `${site}/blog` },
//       { '@type': 'ListItem', position: 3, name: title, item: canonical },
//     ],
//   };

//   return (
//     <>
//       <SeoAuto
//         title={`${title} — Arti Clinic`}
//         description={desc}
//         canonical={canonical}
//         images={{
//           url: ogImage,
//           width: 1200,
//           height: 630,
//           alt: title,
//           type: 'image/jpeg',
//         }}
//         ogType="article"
//         articleMeta={{
//           publishedTime: publishedISO,
//           modifiedTime: modifiedISO,
//           tags: meta.tags,
//         }}
//         jsonLd={[articleLd, breadcrumbLd]}
//         twitterCard="summary_large_image"
//       />

//       <NavBar />
//       <main className="post-wrap">
//         <article className="post">
//           <header className="post-header">
//             <nav className="breadcrumbs" aria-label="Хлебные крошки">
//               <Link to="/">Главная</Link>
//               <span className="sep">·</span>
//               <Link to="/blog">Блог</Link>
//               <span className="sep">·</span>
//               <span aria-current="page">{title}</span>
//             </nav>

//             <h1>{title}</h1>
//             <div className="post-meta">
//               {meta.date && (
//                 <time dateTime={meta.date}>
//                   {new Date(meta.date).toLocaleDateString('ru-RU')}
//                 </time>
//               )}
//               {meta.tags?.length ? <span> • {meta.tags[0]}</span> : null}
//             </div>

//             {meta.cover && (
//               <picture>
//                 <source
//                   srcSet={`${baseCover}-1024.webp 1024w, ${baseCover}-1440.webp 1440w, ${baseCover}-1920.webp 1920w`}
//                   type="image/webp"
//                 />
//                 <img src={`${baseCover}-1024.jpg`} alt={title} />
//               </picture>
//             )}
//           </header>

//           <div
//             className="post-content"
//             dangerouslySetInnerHTML={{ __html: html }}
//           />
//         </article>
//       </main>
//       <Footer />
//     </>
//   );
// }

// src/pages/BlogPost.tsx
// src/lib/fetchPosts.ts
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchPosts, fetchPostHtml } from '@/lib/fetchPosts';
import type { PostCard } from '@/lib/postTypes';
import '@/styles/blog-post.scss';
import { NavBar } from '@/components/NavBar';
import { Footer } from '@/components/Footer';
import SeoAuto from '@/components/SeoAuto';

type State =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ok'; meta: PostCard; html: string };

function makeAbs(urlOrPath: string, site: string) {
  try {
    return new URL(urlOrPath).toString();
  } catch {
    return new URL(
      urlOrPath.startsWith('/') ? urlOrPath : `/${urlOrPath}`,
      site
    ).toString();
  }
}

/** Если fetchPostHtml вернул полный index.html, вырезаем содержимое <article> */
function extractArticle(html: string): string {
  const m = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
  return m ? m[1] : html; // для старого post.html (без <article>) просто вернём как есть
}

export default function BlogPost() {
  const { slug = '' } = useParams();
  const [state, setState] = useState<State>({ status: 'loading' });
  const site =
    (import.meta.env.VITE_SITE_URL as string) || 'https://articlinic.ru';

  useEffect(() => {
    let alive = true;
    setState({ status: 'loading' });

    (async () => {
      const [posts, htmlRaw] = await Promise.all([
        fetchPosts(),
        fetchPostHtml(slug),
      ]);
      if (!alive) return;

      const meta = posts.find((p) => p.slug === slug);
      if (!meta) {
        setState({
          status: 'error',
          message: 'Статья не найдена (нет в списке постов).',
        });
        return;
      }
      if (!htmlRaw) {
        setState({
          status: 'error',
          message: 'Статья не найдена (нет статического HTML).',
        });
        return;
      }

      const html = /<html/i.test(htmlRaw) ? extractArticle(htmlRaw) : htmlRaw;
      setState({ status: 'ok', meta, html });
    })().catch((err) => {
      if (!alive) return;
      setState({
        status: 'error',
        message: err?.message || 'Ошибка загрузки статьи',
      });
    });

    return () => {
      alive = false;
    };
  }, [slug]);

  if (state.status === 'loading') {
    return (
      <>
        <NavBar />
        <main className="post-wrap">
          <p>Загружаем статью…</p>
        </main>
        <Footer />
      </>
    );
  }

  if (state.status === 'error') {
    const og404 = `${site}/og/404-1200x630.jpg`;
    return (
      <>
        <SeoAuto
          title="Статья не найдена — Arti Clinic"
          description="К сожалению, такой страницы нет. Вернитесь к списку статей."
          robots="noindex, nofollow"
          images={{
            url: og404,
            width: 1200,
            height: 630,
            alt: 'Статья не найдена',
            type: 'image/jpeg',
          }}
        />
        <NavBar />
        <main className="post-wrap">
          <h1>Статья не найдена</h1>
          <p>{state.message}</p>
          <p>
            <Link to="/blog">← Вернуться к списку статей</Link>
          </p>
          <noscript>
            <p>
              Откройте статическую версию:{' '}
              <a href={`/blog/${slug}/`}>/blog/{slug}/</a>
            </p>
          </noscript>
        </main>
        <Footer />
      </>
    );
  }

  // status: 'ok'
  const { meta, html } = state;
  const title = meta.title;
  const desc = meta.excerpt || 'Статья блога Arti Clinic';
  const canonical = meta.url
    ? makeAbs(meta.url, site)
    : `${site}/blog/${slug}/`;

  // Если cover локальный (/blog/<slug>/...), для соцсетей предпочитаем og.jpg
  const isLocalCover = !!meta.cover && meta.cover.startsWith(`/blog/${slug}/`);
  const ogImage = isLocalCover
    ? makeAbs(`/blog/${slug}/og.jpg`, site)
    : meta.cover
    ? makeAbs(meta.cover, site)
    : `${site}/og/post-default-1200x630.jpg`;

  const publishedISO = meta.date
    ? new Date(meta.date).toISOString()
    : undefined;
  const modifiedISO = meta.updated
    ? new Date(meta.updated).toISOString()
    : publishedISO;

  const articleLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description: desc,
    datePublished: publishedISO,
    dateModified: modifiedISO,
    image: ogImage ? [ogImage] : undefined,
    author: { '@type': 'Organization', name: 'Arti Clinic' },
    publisher: { '@type': 'Organization', name: 'Arti Clinic' },
    mainEntityOfPage: canonical,
  };

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Главная', item: `${site}/` },
      { '@type': 'ListItem', position: 2, name: 'Блог', item: `${site}/blog` },
      { '@type': 'ListItem', position: 3, name: title, item: canonical },
    ],
  };

  // База для <picture> под новые брейки (если cover локальный)
  const coverBase = isLocalCover
    ? meta.cover!.replace(/\.(jpe?g|png|webp|avif)$/i, '')
    : '';

  return (
    <>
      <SeoAuto
        title={`${title} — Arti Clinic`}
        description={desc}
        canonical={canonical}
        images={{
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title,
          type: 'image/jpeg',
        }}
        ogType="article"
        articleMeta={{
          publishedTime: publishedISO,
          modifiedTime: modifiedISO,
          tags: meta.tags,
        }}
        jsonLd={[articleLd, breadcrumbLd]}
        twitterCard="summary_large_image"
      />

      <NavBar />
      <main className="post-wrap">
        <article className="post">
          <header className="post-header">
            <nav className="breadcrumbs" aria-label="Хлебные крошки">
              <Link to="/">Главная</Link>
              <span className="sep">·</span>
              <Link to="/blog">Блог</Link>
              <span className="sep">·</span>
              <span aria-current="page">{title}</span>
            </nav>

            <h1>{title}</h1>
            <div className="post-meta">
              {meta.date && (
                <time dateTime={meta.date}>
                  {new Date(meta.date).toLocaleDateString('ru-RU')}
                </time>
              )}
              {meta.tags?.length ? <span> • {meta.tags[0]}</span> : null}
            </div>

            {meta.cover && isLocalCover ? (
              <picture>
                <source
                  type="image/avif"
                  srcSet={`${coverBase}-960.avif 960w, ${coverBase}-1280.avif 1280w, ${coverBase}-1600.avif 1600w`}
                  sizes="(max-width: 1360px) 100vw, 1280px"
                />
                <source
                  type="image/webp"
                  srcSet={`${coverBase}-960.webp 960w, ${coverBase}-1280.webp 1280w, ${coverBase}-1600.webp 1600w`}
                  sizes="(max-width: 1360px) 100vw, 1280px"
                />
                <img
                  src={`${coverBase}-1280.webp`}
                  alt={title}
                  loading="lazy"
                  decoding="async"
                />
              </picture>
            ) : meta.cover ? (
              <img
                src={meta.cover}
                alt={title}
                loading="lazy"
                decoding="async"
              />
            ) : null}
          </header>

          <div
            className="post-content"
            // сюда кладём только содержимое <article> из index.html
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </article>

        <noscript>
          <p>
            Статическая версия статьи:{' '}
            <a href={`/blog/${slug}/`}>/blog/{slug}/</a>
          </p>
        </noscript>
      </main>
      <Footer />
    </>
  );
}
