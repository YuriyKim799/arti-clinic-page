// src/components/SeoAuto.tsx
import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';

type JsonLd = Record<string, unknown>;

type Props = {
  title: string;
  description: string;
  image?: string; // абсолютный URL OG-картинки
  jsonLd?: JsonLd | JsonLd[]; // один или массив JSON-LD
  canonical?: string; // вручную переопределить canonical (редко)
  robots?: string; // "noindex, nofollow" и т.п.
  ogType?: 'website' | 'article'; // тип Open Graph
};

function buildCanonical(site: string, path: string) {
  const cleanPath = path.split('#')[0].split('?')[0] || '/';
  const u = new URL(cleanPath, site);
  u.pathname = u.pathname.replace(/\/{2,}/g, '/');
  return u.toString();
}

export default function SeoAuto({
  title,
  description,
  image,
  jsonLd,
  canonical,
  robots,
  ogType = 'website',
}: Props) {
  const { pathname } = useLocation();
  const site = import.meta.env.VITE_SITE_URL || 'https://articlinic.ru';
  const url = canonical ?? buildCanonical(site, pathname);
  const json = Array.isArray(jsonLd) ? jsonLd : jsonLd ? [jsonLd] : [];

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      {robots && <meta name="robots" content={robots} />}
      <link rel="canonical" href={url} />

      {/* Open Graph */}
      <meta property="og:site_name" content="Arti Clinic" />
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      {image && (
        <>
          <meta property="og:image" content={image} />
          {/* Если знаешь точные размеры OG — добавь (ускоряет предпросмотр в соцсетях) */}
          {/* <meta property="og:image:width" content="1200" />
          <meta property="og:image:height" content="630" /> */}
        </>
      )}

      {/* JSON-LD */}
      {json.map((obj, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(obj)}
        </script>
      ))}
    </Helmet>
  );
}
