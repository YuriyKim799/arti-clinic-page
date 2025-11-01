// // src/components/SeoAuto.tsx
// import { Helmet } from 'react-helmet-async';
// import { useLocation } from 'react-router-dom';
// import React, { Fragment, useMemo } from 'react';

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
//   canonical?: string; // если передаёшь — query/hash будут удалены
//   robots?: string;
//   ogType?: 'website' | 'article';
//   locale?: string; // по умолчанию ru_RU

//   /** Twitter Cards */
//   twitterCard?: 'summary' | 'summary_large_image';
//   twitterSite?: string; // @handle
//   twitterCreator?: string; // @handle

//   /** Только для ogType="article" */
//   articleMeta?: ArticleMeta;

//   /** Тех-флаги */
//   noindex?: boolean; // для служебных страниц
//   isNotFound?: boolean; // 404
// };

// // === Константы/утилиты нормализации ========================================

// const SITE_FALLBACK = 'https://articlinic.ru';

// /** Единая политика хвостового слэша: без слэша, кроме "/" */
// function normalizePathname(pathname: string) {
//   if (!pathname || pathname === '/') return '/';
//   const once = pathname.replace(/\/{2,}/g, '/'); // сжать мультислэши
//   return once.replace(/\/+$/, ''); // убрать завершающий слэш
// }

// /** Полная чистка URL: убираем query/hash и нормализуем путь, сохраняя origin */
// function cleanUrlKeepOrigin(site: string, raw: string) {
//   const s = site || SITE_FALLBACK;
//   const u = new URL(raw, s);
//   u.search = '';
//   u.hash = '';
//   u.pathname = normalizePathname(u.pathname);
//   return u.toString();
// }

// /** Строим каноникал только из site + pathname, убирая query/hash */
// function buildCanonical(site: string, path: string) {
//   const s = site || SITE_FALLBACK;
//   const cleanPath = (path || '/').split('#')[0].split('?')[0] || '/';
//   const u = new URL(cleanPath, s);
//   u.pathname = normalizePathname(u.pathname);
//   u.search = '';
//   u.hash = '';
//   return u.toString();
// }

// /** Превращаем относительный src в абсолютный */
// function toAbsolute(site: string, maybeUrl: string) {
//   const s = site || SITE_FALLBACK;
//   try {
//     return new URL(maybeUrl).toString(); // уже абсолютный
//   } catch {
//     return new URL(maybeUrl, s).toString(); // относительный -> абсолютный
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

// // === Компонент ===============================================================

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
//   noindex,
//   isNotFound,
// }: Props) {
//   const { pathname } = useLocation();
//   const site = import.meta.env.VITE_SITE_URL || SITE_FALLBACK;

//   // Канонический URL: всегда без query/hash, нормализованный путь
//   const url = useMemo(
//     () =>
//       canonical
//         ? cleanUrlKeepOrigin(site, canonical)
//         : buildCanonical(site, pathname),
//     [canonical, pathname, site]
//   );

//   const json = useMemo(
//     () => (Array.isArray(jsonLd) ? jsonLd : jsonLd ? [jsonLd] : []),
//     [jsonLd]
//   );

//   const ogImages = useMemo(
//     () =>
//       normalizeImages(
//         site,
//         image
//           ? {
//               url: image,
//               width: imageWidth,
//               height: imageHeight,
//               alt: imageAlt,
//               type: imageType,
//             }
//           : undefined,
//         images
//       ),
//     [site, image, imageWidth, imageHeight, imageAlt, imageType, images]
//   );

//   const twitterImage = ogImages[0]?.url;

//   const robotsContent = useMemo(() => {
//     if (isNotFound) return 'noindex,follow';
//     if (noindex) return 'noindex,follow';
//     return robots || undefined;
//   }, [isNotFound, noindex, robots]);

//   return (
//     <Helmet>
//       {/* Title/Description */}
//       <title>{title}</title>
//       <meta name="description" content={description} />
//       {robotsContent && <meta name="robots" content={robotsContent} />}

//       {/* Canonical — строго без query/hash */}
//       <link rel="canonical" href={url} />

//       {/* Open Graph */}
//       <meta property="og:site_name" content="Арти Клиник" />
//       <meta property="og:locale" content={locale} />
//       <meta property="og:type" content={ogType} />
//       <meta property="og:url" content={url} />
//       <meta property="og:title" content={title} />
//       <meta property="og:description" content={description} />

//       {/* og:image (один или несколько, с размерами) */}
//       {ogImages.map((img, idx) => (
//         <Fragment key={idx}>
//           <meta property="og:image" content={img.url} />
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
//         <script
//           key={i}
//           type="application/ld+json"
//           // так надёжнее для некоторых парсеров
//           dangerouslySetInnerHTML={{ __html: JSON.stringify(obj) }}
//         />
//       ))}
//     </Helmet>
//   );
// }

// src/components/SeoAuto.tsx
import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import React, { Fragment, useMemo } from 'react';

type JsonLd = Record<string, unknown>;

type OgImageInput =
  | string
  | {
      url: string;
      width?: number;
      height?: number;
      alt?: string;
      type?: 'image/jpeg' | 'image/png' | 'image/webp';
    };

type ArticleMeta = {
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  section?: string;
  tags?: string[];
};

type Props = {
  title: string;
  description?: string;

  image?: string;
  imageWidth?: number;
  imageHeight?: number;
  imageAlt?: string;
  imageType?: 'image/jpeg' | 'image/png' | 'image/webp';

  images?: OgImageInput | OgImageInput[];

  jsonLd?: JsonLd | JsonLd[];
  canonical?: string;
  robots?: string;
  ogType?: 'website' | 'article';
  locale?: string;

  twitterCard?: 'summary' | 'summary_large_image';
  twitterSite?: string;
  twitterCreator?: string;

  articleMeta?: ArticleMeta;

  noindex?: boolean;
  isNotFound?: boolean;

  enforceNoindexOnParams?: boolean;
  allowCrossOriginCanonical?: boolean;

  siteName?: string;
};

const SITE_FALLBACK = 'https://articlinic.ru';

function normalizePathname(pathname: string) {
  if (!pathname || pathname === '/') return '/';
  const once = pathname.replace(/\/{2,}/g, '/');
  return once.replace(/\/+$/, '');
}

function stripQueryAndHash(url: string) {
  try {
    const u = new URL(url);
    u.search = '';
    u.hash = '';
    return u.toString();
  } catch {
    return url;
  }
}

function buildCanonical(site: string, path: string) {
  const s = site || SITE_FALLBACK;
  let cleanPath = (path || '/').split('#')[0].split('?')[0] || '/';
  cleanPath = cleanPath.replace(/\/index\.html$/i, '/');
  const u = new URL(cleanPath, s);
  u.pathname = normalizePathname(u.pathname);
  u.search = '';
  u.hash = '';
  return u.toString();
}

function cleanUrlKeepOrigin(
  site: string,
  raw: string,
  allowCrossOrigin = false
) {
  const s = site || SITE_FALLBACK;
  const u = new URL(raw, s);

  if (!allowCrossOrigin) {
    const siteUrl = new URL(s);
    if (u.origin !== siteUrl.origin) {
      return buildCanonical(s, u.pathname);
    }
  }

  u.search = '';
  u.hash = '';
  u.pathname = normalizePathname(u.pathname);
  return u.toString();
}

function toAbsolute(site: string, maybeUrl: string) {
  const s = site || SITE_FALLBACK;
  try {
    return new URL(maybeUrl).toString();
  } catch {
    return new URL(maybeUrl, s).toString();
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

  if (imageLegacy?.url && imageLegacy.url.trim().length > 0) {
    list.push({
      url: stripQueryAndHash(toAbsolute(site, imageLegacy.url)),
      width: imageLegacy.width,
      height: imageLegacy.height,
      alt: imageLegacy.alt,
      type: imageLegacy.type,
    });
  }

  const arr = images ? (Array.isArray(images) ? images : [images]) : [];
  for (const it of arr) {
    if (typeof it === 'string') {
      if (it.trim().length > 0) {
        list.push({ url: stripQueryAndHash(toAbsolute(site, it)) });
      }
    } else if (it?.url && it.url.trim().length > 0) {
      list.push({
        url: stripQueryAndHash(toAbsolute(site, it.url)),
        width: it.width,
        height: it.height,
        alt: it.alt,
        type: it.type,
      });
    }
  }

  const seen = new Set<string>();
  return list.filter((i) =>
    seen.has(i.url) ? false : (seen.add(i.url), true)
  );
}

const JUNK_PARAMS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'utm_referer',
  'utm_ya_campaign',
  'yabizcmpgn',
  'utm_candidate',
  'yclid',
  'gclid',
  'fbclid',
  'from',
  'ref',
  'referrer',
  'ybaip',
  'etext',
  'yqppel',
];

function hasJunkParams(search: string) {
  if (!search) return false;
  const params = new URLSearchParams(search);
  for (const name of JUNK_PARAMS) {
    if (params.has(name)) return true;
  }
  return false;
}

// простой стабильный хэш для ключа JSON-LD (избегаем коллизий для коротких массивов)
function hashJson(obj: unknown) {
  const str = JSON.stringify(obj) ?? '';
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) | 0;
  }
  return String(h);
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
  enforceNoindexOnParams = false,
  allowCrossOriginCanonical = false,
  siteName,
}: Props) {
  const { pathname, search } = useLocation();
  const site = import.meta.env.VITE_SITE_URL || SITE_FALLBACK;
  const resolvedSiteName =
    siteName || import.meta.env.VITE_SITE_NAME || 'Арти Клиник';
  const resolvedDescription =
    description || import.meta.env.VITE_SITE_DESCRIPTION || '';

  const url = useMemo(
    () =>
      canonical
        ? cleanUrlKeepOrigin(site, canonical, allowCrossOriginCanonical)
        : buildCanonical(site, pathname),
    [canonical, pathname, site, allowCrossOriginCanonical]
  );

  const json = useMemo(
    () => (Array.isArray(jsonLd) ? jsonLd : jsonLd ? [jsonLd] : []),
    [jsonLd]
  );

  const ogImages = useMemo(
    () =>
      normalizeImages(
        site,
        image && image.trim().length > 0
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
  const twitterImageAlt = ogImages[0]?.alt;

  const isJunkUrl = useMemo(() => hasJunkParams(search), [search]);

  const robotsContent = useMemo(() => {
    if (isNotFound) return 'noindex,follow';
    if (noindex) return 'noindex,follow';
    if (enforceNoindexOnParams && isJunkUrl) return 'noindex,follow';
    return robots || undefined;
  }, [isNotFound, noindex, enforceNoindexOnParams, isJunkUrl, robots]);

  const safeTitle = title && title.trim().length > 0 ? title : resolvedSiteName;

  return (
    <Helmet>
      <title>{safeTitle}</title>
      {resolvedDescription && (
        <meta name="description" content={resolvedDescription} />
      )}
      {robotsContent && <meta name="robots" content={robotsContent} />}

      <link rel="canonical" href={url} />

      <meta property="og:site_name" content={resolvedSiteName} />
      <meta property="og:locale" content={locale} />
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={safeTitle} />
      {resolvedDescription && (
        <meta property="og:description" content={resolvedDescription} />
      )}

      {ogImages.map((img) => (
        <Fragment key={img.url}>
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

      {ogType === 'article' && articleMeta && (
        <>
          {articleMeta.publishedTime && (
            <meta
              property="article:published_time"
              content={articleMeta.publishedTime}
            />
          )}
          {articleMeta.modifiedTime && (
            <>
              <meta
                property="article:modified_time"
                content={articleMeta.modifiedTime}
              />
              <meta
                property="og:updated_time"
                content={articleMeta.modifiedTime}
              />
            </>
          )}
          {articleMeta.author && (
            <meta property="article:author" content={articleMeta.author} />
          )}
          {articleMeta.section && (
            <meta property="article:section" content={articleMeta.section} />
          )}
          {articleMeta.tags?.map((t) =>
            t ? <meta key={t} property="article:tag" content={t} /> : null
          )}
        </>
      )}

      <meta name="twitter:card" content={twitterCard} />
      {twitterSite && <meta name="twitter:site" content={twitterSite} />}
      {twitterCreator && (
        <meta name="twitter:creator" content={twitterCreator} />
      )}
      <meta name="twitter:title" content={safeTitle} />
      {resolvedDescription && (
        <meta name="twitter:description" content={resolvedDescription} />
      )}
      {twitterImage && <meta name="twitter:image" content={twitterImage} />}
      {twitterImageAlt && (
        <meta name="twitter:image:alt" content={twitterImageAlt} />
      )}

      {twitterImage && <link rel="image_src" href={twitterImage} />}

      {json.map((obj) => {
        const id = (obj as any)['@id'] as string | undefined;
        const key = id || hashJson(obj);
        return (
          <script
            key={key}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(obj) }}
          />
        );
      })}
    </Helmet>
  );
}
