// import React, { useState, useRef, useEffect } from 'react';
// import styles from './Hero.module.scss';
// import { useInView } from '../useInView';
// import heroVideo from '../assets/hero-bg.mp4';
// import WhatsAppButton from '@/components/WhatsAppButton/WhatsAppButton';
// import TelegramButton from '@/components/TelegramButton/TelegramButton';
// import RecordButton from './RecordButton/RecordButton';

// import heroFallback from '@/assets/hero-doctor.png';
// const heroAvifEntries = import.meta.glob('/src/assets/hero-doctor-*.avif', {
//   eager: true,
//   query: '?url',
//   import: 'default',
// }) as Record<string, string>;

// const heroWebpEntries = import.meta.glob('/src/assets/hero-doctor-*.webp', {
//   eager: true,
//   query: '?url',
//   import: 'default',
// }) as Record<string, string>;

// function toSrcSet(entries: Record<string, string>) {
//   return Object.entries(entries)
//     .map(([file, url]) => {
//       const m = file.match(/-(\d+)\.(avif|webp)$/i);
//       return m ? { w: Number(m[1]), url } : null;
//     })
//     .filter(Boolean)
//     .sort((a, b) => a!.w - b!.w)
//     .map((x) => `${x!.url} ${x!.w}w`)
//     .join(', ');
// }

// const heroAvifSrcSet = toSrcSet(heroAvifEntries);
// const heroWebpSrcSet = toSrcSet(heroWebpEntries);

// export const Hero: React.FC = () => {
//   const { ref, isIntersecting } = useInView<HTMLDivElement>();
//   const [ready, setReady] = useState(false);
//   // ленивое подключение <source> только при входе во вьюпорт
//   const [loadVideo, setLoadVideo] = useState(false);
//   const videoRef = useRef<HTMLVideoElement>(null);

//   useEffect(() => {
//     if (isIntersecting && !loadVideo) {
//       setLoadVideo(true); // подставим src у <source> (см. ниже)
//     }

//     const v = videoRef.current;
//     if (!v) return;

//     const prefersReduced =
//       typeof window !== 'undefined' &&
//       window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
//     if (prefersReduced) return;
//     if (isIntersecting && !prefersReduced) {
//       // попытка автоплея только когда виден
//       v.play().catch(() => {});
//     } else {
//       // уехали из вьюпорта или reduce motion — ставим на паузу
//       if (!v.paused) v.pause();
//     }
//   }, [isIntersecting, loadVideo]);

//   return (
//     <header className={`${styles.hero} section`}>
//       <video
//         ref={videoRef}
//         className={`${styles.bgVideo} ${ready ? styles.ready : ''}`}
//         preload="none"
//         muted
//         loop
//         playsInline
//         onCanPlay={() => setReady(true)}
//       >
//         {loadVideo && <source src={heroVideo} type="video/mp4" />}
//       </video>
//       <div
//         ref={ref}
//         className={`container reveal ${isIntersecting ? 'is-visible' : ''}`}
//       >
//         <div className={styles.wrap}>
//           <div className={styles.photoCard} aria-hidden="true">
//             <picture>
//               <source type="image/avif" srcSet={heroAvifSrcSet} sizes="100vw" />
//               <source type="image/webp" srcSet={heroWebpSrcSet} sizes="100vw" />
//               <img
//                 src={heroFallback}
//                 alt="Arti Clinic — лечение спины и суставов"
//                 loading="eager"
//                 decoding="async"
//                 className={styles.heroImg}
//               />
//             </picture>
//           </div>
//           <div className={styles.content}>
//             <h1 className={styles.title}>
//               ЛЕЧИМ БОЛИ
//               <br /> В СПИНЕ И МЕЖПОЗВОНКОВЫЕ ГРЫЖИ <br />
//               БЕЗ ОПЕРАЦИИ В МОСКВЕ
//             </h1>
//             <p className={styles.subtitle}>
//               Центр вертеброневрологии, рефлексотерапии и мануальной терапии
//             </p>
//             <div className={styles.ctaRow}>
//               <RecordButton variant="primary">Записаться онлайн</RecordButton>
//               <WhatsAppButton phone="+79998310636" variant="primary" />
//               <TelegramButton to="@Artiklinic" variant="primary" />
//             </div>
//           </div>
//         </div>
//       </div>
//     </header>
//   );
// };

import React, { useState, useRef, useEffect, useMemo } from 'react';
import styles from './Hero.module.scss';
import { useInView } from '../useInView';
import WhatsAppButton from '@/components/WhatsAppButton/WhatsAppButton';
import TelegramButton from '@/components/TelegramButton/TelegramButton';
import RecordButton from './RecordButton/RecordButton';

import heroFallback from '@/assets/hero-doctor.png';

// responsive hero images
const heroAvifEntries = import.meta.glob('/src/assets/hero-doctor-*.avif', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;
const heroWebpEntries = import.meta.glob('/src/assets/hero-doctor-*.webp', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

// responsive hero videos: hero-bg-480.mp4, hero-bg-720.mp4, hero-bg-1080.mp4
const heroVideoEntries = import.meta.glob('/src/assets/hero-bg-*.mp4', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

// запасной вариант (один mp4), если нет набора
import heroVideoDefault from '../assets/hero-bg.mp4';

function toSrcSet(entries: Record<string, string>) {
  return Object.entries(entries)
    .map(([file, url]) => {
      const m = file.match(/-(\d+)\.(avif|webp)$/i);
      return m ? { w: Number(m[1]), url } : null;
    })
    .filter(Boolean)
    .sort((a, b) => a!.w - b!.w)
    .map((x) => `${x!.url} ${x!.w}w`)
    .join(', ');
}

const heroAvifSrcSet = toSrcSet(heroAvifEntries);
const heroWebpSrcSet = toSrcSet(heroWebpEntries);

function getVideoUrlForWidth(width: number): string | null {
  const variants = Object.entries(heroVideoEntries)
    .map(([file, url]) => {
      const m = file.match(/hero-bg-(\d+)\.mp4$/);
      return m ? { w: Number(m[1]), url } : null;
    })
    .filter(Boolean)
    .sort((a, b) => a!.w - b!.w) as { w: number; url: string }[];

  if (!variants.length) return null;

  // мобилка: жёстко 480
  if (width <= 480) {
    return variants.find((v) => v.w === 720)?.url || variants[0].url;
  }
  // средние — 720
  if (width <= 900) {
    return variants.find((v) => v.w === 720)?.url || variants[0].url;
  }
  // десктоп — 1080
  return (
    variants.find((v) => v.w === 1080)?.url || variants[variants.length - 1].url
  );
}

export const Hero: React.FC = () => {
  const { ref, isIntersecting } = useInView<HTMLDivElement>();
  const [ready, setReady] = useState(false);
  const [loadVideo, setLoadVideo] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Решаем, какой файл подставить, и начинаем загрузку ТОЛЬКО когда блок попал во вьюпорт
  useEffect(() => {
    if (!isIntersecting || loadVideo) return;

    const width =
      typeof window !== 'undefined'
        ? Math.min(window.innerWidth || 0, screen?.width || 0) || 0
        : 0;

    const chosen = getVideoUrlForWidth(width) || heroVideoDefault;
    setVideoUrl(chosen);
    setLoadVideo(true);
  }, [isIntersecting, loadVideo]);

  // Автопауза/автоплей по видимости
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    if (prefersReduced || !loadVideo) {
      if (!v.paused) v.pause();
      return;
    }

    if (isIntersecting) {
      v.play().catch(() => {});
    } else {
      if (!v.paused) v.pause();
    }
  }, [isIntersecting, loadVideo]);

  const Picture = useMemo(
    () => (
      <picture>
        <source type="image/avif" srcSet={heroAvifSrcSet} sizes="100vw" />
        <source type="image/webp" srcSet={heroWebpSrcSet} sizes="100vw" />
        <img
          src={heroFallback}
          alt="Arti Clinic — лечение спины и суставов"
          loading="eager"
          decoding="async"
          className={styles.heroImg}
        />
      </picture>
    ),
    []
  );

  return (
    <header className={`${styles.hero} section`}>
      <video
        ref={videoRef}
        className={`${styles.bgVideo} ${ready ? styles.ready : ''}`}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata" // постера нет, но схватим метаданные/первый кадр как можно раньше
        // poster УДАЛЁН по твоему запросу
        onLoadedData={() => setReady(true)} // показываем видео, как только доступен первый кадр
      >
        {loadVideo && videoUrl ? (
          <source src={videoUrl} type="video/mp4" />
        ) : null}
      </video>

      <div
        ref={ref}
        className={`container reveal ${isIntersecting ? 'is-visible' : ''}`}
      >
        <div className={styles.wrap}>
          <div className={styles.photoCard} aria-hidden="true">
            {Picture}
          </div>
          <div className={styles.content}>
            <h1 className={styles.title}>
              ЛЕЧИМ БОЛИ
              <br /> В СПИНЕ И МЕЖПОЗВОНКОВЫЕ ГРЫЖИ <br />
              БЕЗ ОПЕРАЦИИ В МОСКВЕ
            </h1>
            <p className={styles.subtitle}>
              Центр вертеброневрологии, рефлексотерапии и мануальной терапии
            </p>
            <div className={styles.ctaRow}>
              <RecordButton variant="primary">Записаться онлайн</RecordButton>
              <WhatsAppButton phone="+79998310636" variant="primary" />
              <TelegramButton to="@Artiklinic" variant="primary" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
