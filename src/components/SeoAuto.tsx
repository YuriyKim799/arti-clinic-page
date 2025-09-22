// // src/components/SeoAuto.tsx
// import { Helmet } from 'react-helmet-async';
// import { useLocation } from 'react-router-dom';

// type JsonLd = Record<string, unknown>;

// type OgImageInput =
//   | string
//   | {
//       url: string; // абсолютный или относительный
//       width?: number; // px
//       height?: number; // px
//       alt?: string;
//       type?: 'image/jpeg' | 'image/png' | 'image/webp';
//     };

// type ArticleMeta = {
//   publishedTime?: string; // ISO: 2025-08-26T10:00:00+03:00
//   modifiedTime?: string; // ISO
//   author?: string; // Имя/URL автора
//   section?: string; // Рубрика
//   tags?: string[]; // Теги
// };

// type Props = {
//   title: string;
//   description: string;

//   /** ЛЕГАСИ: один URL (оставлено для совместимости) */
//   image?: string;
//   imageWidth?: number;
//   imageHeight?: number;
//   imageAlt?: string;
//   imageType?: 'image/jpeg' | 'image/png' | 'image/webp';

//   /** НОВОЕ: один или несколько изображений c размерами */
//   images?: OgImageInput | OgImageInput[];

//   jsonLd?: JsonLd | JsonLd[];
//   canonical?: string;
//   robots?: string;
//   ogType?: 'website' | 'article';
//   locale?: string; // по умолчанию ru_RU

//   /** Twitter Cards */
//   twitterCard?: 'summary' | 'summary_large_image';
//   twitterSite?: string; // @handle
//   twitterCreator?: string; // @handle

//   /** Только для ogType="article" */
//   articleMeta?: ArticleMeta;
// };

// function buildCanonical(site: string, path: string) {
//   const cleanPath = path.split('#')[0].split('?')[0] || '/';
//   const u = new URL(cleanPath, site);
//   u.pathname = u.pathname.replace(/\/{2,}/g, '/');
//   return u.toString();
// }

// function toAbsolute(site: string, maybeUrl: string) {
//   try {
//     // уже абсолютная
//     return new URL(maybeUrl).toString();
//   } catch {
//     // относительная -> абсолютная
//     return new URL(maybeUrl, site).toString();
//   }
// }

// function normalizeImages(
//   site: string,
//   imageLegacy?: {
//     url?: string;
//     width?: number;
//     height?: number;
//     alt?: string;
//     type?: 'image/jpeg' | 'image/png' | 'image/webp';
//   },
//   images?: OgImageInput | OgImageInput[]
// ) {
//   const list: Array<{
//     url: string;
//     width?: number;
//     height?: number;
//     alt?: string;
//     type?: 'image/jpeg' | 'image/png' | 'image/webp';
//   }> = [];

//   if (imageLegacy?.url) {
//     list.push({
//       url: toAbsolute(site, imageLegacy.url),
//       width: imageLegacy.width,
//       height: imageLegacy.height,
//       alt: imageLegacy.alt,
//       type: imageLegacy.type,
//     });
//   }

//   const arr = images ? (Array.isArray(images) ? images : [images]) : [];
//   for (const it of arr) {
//     if (typeof it === 'string') {
//       list.push({ url: toAbsolute(site, it) });
//     } else if (it?.url) {
//       list.push({
//         url: toAbsolute(site, it.url),
//         width: it.width,
//         height: it.height,
//         alt: it.alt,
//         type: it.type,
//       });
//     }
//   }

//   // убрать дубликаты по URL
//   const seen = new Set<string>();
//   return list.filter((i) =>
//     seen.has(i.url) ? false : (seen.add(i.url), true)
//   );
// }

// export default function SeoAuto({
//   title,
//   description,
//   image,
//   imageWidth,
//   imageHeight,
//   imageAlt,
//   imageType,
//   images,
//   jsonLd,
//   canonical,
//   robots,
//   ogType = 'website',
//   locale = 'ru_RU',
//   twitterCard = 'summary_large_image',
//   twitterSite,
//   twitterCreator,
//   articleMeta,
// }: Props) {
//   const { pathname } = useLocation();
//   const site = import.meta.env.VITE_SITE_URL || 'https://articlinic.ru';
//   const url = canonical ?? buildCanonical(site, pathname);
//   const json = Array.isArray(jsonLd) ? jsonLd : jsonLd ? [jsonLd] : [];

//   const ogImages = normalizeImages(
//     site,
//     image
//       ? {
//           url: image,
//           width: imageWidth,
//           height: imageHeight,
//           alt: imageAlt,
//           type: imageType,
//         }
//       : undefined,
//     images
//   );

//   const twitterImage = ogImages[0]?.url; // Twitter берёт только одну

//   return (
//     <Helmet>
//       <title>{title}</title>
//       <meta name="description" content={description} />
//       {robots && <meta name="robots" content={robots} />}
//       <link rel="canonical" href={url} />

//       {/* Open Graph */}
//       <meta property="og:site_name" content="Arti Clinic" />
//       <meta property="og:locale" content={locale} />
//       <meta property="og:type" content={ogType} />
//       <meta property="og:url" content={url} />
//       <meta property="og:title" content={title} />
//       <meta property="og:description" content={description} />

//       {/* og:image (один или несколько, с размерами) */}
//       {ogImages.map((img, idx) => (
//         <Fragment key={idx}>
//           <meta property="og:image" content={img.url} />
//           {/* для https — дублируем secure_url, Яндекс и соцсети иногда ускоряют парсинг */}
//           <meta property="og:image:secure_url" content={img.url} />
//           {img.width && (
//             <meta property="og:image:width" content={String(img.width)} />
//           )}
//           {img.height && (
//             <meta property="og:image:height" content={String(img.height)} />
//           )}
//           {img.alt && <meta property="og:image:alt" content={img.alt} />}
//           {img.type && <meta property="og:image:type" content={img.type} />}
//         </Fragment>
//       ))}

//       {/* Article extras */}
//       {ogType === 'article' && articleMeta && (
//         <>
//           {articleMeta.publishedTime && (
//             <meta
//               property="article:published_time"
//               content={articleMeta.publishedTime}
//             />
//           )}
//           {articleMeta.modifiedTime && (
//             <meta
//               property="article:modified_time"
//               content={articleMeta.modifiedTime}
//             />
//           )}
//           {articleMeta.author && (
//             <meta property="article:author" content={articleMeta.author} />
//           )}
//           {articleMeta.section && (
//             <meta property="article:section" content={articleMeta.section} />
//           )}
//           {articleMeta.tags?.map((t, i) => (
//             <meta key={i} property="article:tag" content={t} />
//           ))}
//         </>
//       )}

//       {/* Twitter */}
//       <meta name="twitter:card" content={twitterCard} />
//       {twitterSite && <meta name="twitter:site" content={twitterSite} />}
//       {twitterCreator && (
//         <meta name="twitter:creator" content={twitterCreator} />
//       )}
//       <meta name="twitter:title" content={title} />
//       <meta name="twitter:description" content={description} />
//       {twitterImage && <meta name="twitter:image" content={twitterImage} />}

//       {/* Fallback для некоторых парсеров */}
//       {twitterImage && <link rel="image_src" href={twitterImage} />}

//       {/* JSON-LD */}
//       {json.map((obj, i) => (
//         <script key={i} type="application/ld+json">
//           {JSON.stringify(obj)}
//         </script>
//       ))}
//     </Helmet>
//   );
// }

// // Не забудь импортировать Fragment
// import { Fragment } from 'react';

// src/components/SeoAuto.tsx
import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import React, { Fragment, useMemo } from 'react';

type JsonLd = Record<string, unknown>;

type OgImageInput =
  | string
  | {
      url: string; // абсолютный или относительный
      width?: number; // px
      height?: number; // px
      alt?: string;
      type?: 'image/jpeg' | 'image/png' | 'image/webp';
    };

type ArticleMeta = {
  publishedTime?: string; // ISO: 2025-08-26T10:00:00+03:00
  modifiedTime?: string; // ISO
  author?: string; // Имя/URL автора
  section?: string; // Рубрика
  tags?: string[]; // Теги
};

type Props = {
  title: string;
  description: string;

  /** ЛЕГАСИ: один URL (оставлено для совместимости) */
  image?: string;
  imageWidth?: number;
  imageHeight?: number;
  imageAlt?: string;
  imageType?: 'image/jpeg' | 'image/png' | 'image/webp';

  /** НОВОЕ: один или несколько изображений c размерами */
  images?: OgImageInput | OgImageInput[];

  jsonLd?: JsonLd | JsonLd[];
  canonical?: string; // если передаёшь — query/hash будут удалены
  robots?: string;
  ogType?: 'website' | 'article';
  locale?: string; // по умолчанию ru_RU

  /** Twitter Cards */
  twitterCard?: 'summary' | 'summary_large_image';
  twitterSite?: string; // @handle
  twitterCreator?: string; // @handle

  /** Только для ogType="article" */
  articleMeta?: ArticleMeta;

  /** Тех-флаги */
  noindex?: boolean; // для служебных страниц
  isNotFound?: boolean; // 404
};

function cleanUrlKeepOrigin(site: string, raw: string) {
  const u = new URL(raw, site);
  u.search = '';
  u.hash = '';
  u.pathname =
    u.pathname === '/'
      ? '/'
      : u.pathname.replace(/\/{2,}/g, '/').replace(/\/+$/, '');
  return u.toString();
}

function buildCanonical(site: string, path: string) {
  const cleanPath = (path || '/').split('#')[0].split('?')[0] || '/';
  const u = new URL(cleanPath, site);
  u.pathname =
    u.pathname === '/'
      ? '/'
      : u.pathname.replace(/\/{2,}/g, '/').replace(/\/+$/, '');
  return u.toString();
}

function toAbsolute(site: string, maybeUrl: string) {
  try {
    // уже абсолютная
    return new URL(maybeUrl).toString();
  } catch {
    // относительная -> абсолютная
    return new URL(maybeUrl, site).toString();
  }
}

function normalizeImages(
  site: string,
  imageLegacy?: {
    url?: string;
    width?: number;
    height?: number;
    alt?: string;
    type?: 'image/jpeg' | 'image/png' | 'image/webp';
  },
  images?: OgImageInput | OgImageInput[]
) {
  const list: Array<{
    url: string;
    width?: number;
    height?: number;
    alt?: string;
    type?: 'image/jpeg' | 'image/png' | 'image/webp';
  }> = [];

  if (imageLegacy?.url) {
    list.push({
      url: toAbsolute(site, imageLegacy.url),
      width: imageLegacy.width,
      height: imageLegacy.height,
      alt: imageLegacy.alt,
      type: imageLegacy.type,
    });
  }

  const arr = images ? (Array.isArray(images) ? images : [images]) : [];
  for (const it of arr) {
    if (typeof it === 'string') {
      list.push({ url: toAbsolute(site, it) });
    } else if (it?.url) {
      list.push({
        url: toAbsolute(site, it.url),
        width: it.width,
        height: it.height,
        alt: it.alt,
        type: it.type,
      });
    }
  }

  // убрать дубликаты по URL
  const seen = new Set<string>();
  return list.filter((i) =>
    seen.has(i.url) ? false : (seen.add(i.url), true)
  );
}

export default function SeoAuto({
  title,
  description,
  image,
  imageWidth,
  imageHeight,
  imageAlt,
  imageType,
  images,
  jsonLd,
  canonical,
  robots,
  ogType = 'website',
  locale = 'ru_RU',
  twitterCard = 'summary_large_image',
  twitterSite,
  twitterCreator,
  articleMeta,
  noindex,
  isNotFound,
}: Props) {
  const { pathname } = useLocation();
  const site = import.meta.env.VITE_SITE_URL;

  const url = useMemo(
    () =>
      canonical
        ? cleanUrlKeepOrigin(site, canonical)
        : buildCanonical(site, pathname),
    [canonical, pathname, site]
  );

  const json = useMemo(
    () => (Array.isArray(jsonLd) ? jsonLd : jsonLd ? [jsonLd] : []),
    [jsonLd]
  );

  const ogImages = useMemo(
    () =>
      normalizeImages(
        site,
        image
          ? {
              url: image,
              width: imageWidth,
              height: imageHeight,
              alt: imageAlt,
              type: imageType,
            }
          : undefined,
        images
      ),
    [site, image, imageWidth, imageHeight, imageAlt, imageType, images]
  );

  const twitterImage = ogImages[0]?.url;

  const robotsContent = useMemo(() => {
    if (isNotFound) return 'noindex,follow';
    if (noindex) return 'noindex,follow';
    return robots || undefined;
  }, [isNotFound, noindex, robots]);

  return (
    <Helmet>
      {/* Title/Description */}
      <title>{title}</title>
      <meta name="description" content={description} />
      {robotsContent && <meta name="robots" content={robotsContent} />}

      {/* Canonical */}
      <link rel="canonical" href={url} />

      {/* Open Graph */}
      <meta property="og:site_name" content="Арти Клиник" />
      <meta property="og:locale" content={locale} />
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />

      {/* og:image (один или несколько, с размерами) */}
      {ogImages.map((img, idx) => (
        <Fragment key={idx}>
          <meta property="og:image" content={img.url} />
          <meta property="og:image:secure_url" content={img.url} />
          {img.width && (
            <meta property="og:image:width" content={String(img.width)} />
          )}
          {img.height && (
            <meta property="og:image:height" content={String(img.height)} />
          )}
          {img.alt && <meta property="og:image:alt" content={img.alt} />}
          {img.type && <meta property="og:image:type" content={img.type} />}
        </Fragment>
      ))}

      {/* Article extras */}
      {ogType === 'article' && articleMeta && (
        <>
          {articleMeta.publishedTime && (
            <meta
              property="article:published_time"
              content={articleMeta.publishedTime}
            />
          )}
          {articleMeta.modifiedTime && (
            <meta
              property="article:modified_time"
              content={articleMeta.modifiedTime}
            />
          )}
          {articleMeta.author && (
            <meta property="article:author" content={articleMeta.author} />
          )}
          {articleMeta.section && (
            <meta property="article:section" content={articleMeta.section} />
          )}
          {articleMeta.tags?.map((t, i) => (
            <meta key={i} property="article:tag" content={t} />
          ))}
        </>
      )}

      {/* Twitter */}
      <meta name="twitter:card" content={twitterCard} />
      {twitterSite && <meta name="twitter:site" content={twitterSite} />}
      {twitterCreator && (
        <meta name="twitter:creator" content={twitterCreator} />
      )}
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      {twitterImage && <meta name="twitter:image" content={twitterImage} />}

      {/* Fallback для некоторых парсеров */}
      {twitterImage && <link rel="image_src" href={twitterImage} />}

      {/* JSON-LD */}
      {json.map((obj, i) => (
        <script
          key={i}
          type="application/ld+json"
          // так надёжнее для некоторых парсеров
          dangerouslySetInnerHTML={{ __html: JSON.stringify(obj) }}
        />
      ))}
    </Helmet>
  );
}
