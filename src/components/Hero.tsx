import React, { useState, useRef, useEffect, useMemo } from 'react';
import styles from './Hero.module.scss';
import { useInView } from '../useInView';
import WhatsAppButton from '@/components/WhatsAppButton/WhatsAppButton';
import TelegramButton from '@/components/TelegramButton/TelegramButton';
import RecordButton from './RecordButton/RecordButton';

import heroFallback from '@/assets/hero-doctor2.jpg';
import heroVideoWebm from '@/assets/hero-bg3.webm';
import heroVideoMp4 from '@/assets/hero-bg3.mp4';
import heroVideoPoster from '@/assets/hero-poster3.webp';

// responsive hero images
const heroAvifEntries = import.meta.glob('/src/assets/hero-doctor2-*.avif', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;
const heroWebpEntries = import.meta.glob('/src/assets/hero-doctor2-*.webp', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

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
const heroImageSizes = '(max-width: 1024px) 320px, 50vw';

export const Hero: React.FC = () => {
  const { ref, isIntersecting } = useInView<HTMLDivElement>();
  const [loadVideo, setLoadVideo] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [photoReady, setPhotoReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Начинаем загрузку видео только когда блок попал во вьюпорт
  useEffect(() => {
    if (isIntersecting && !loadVideo) {
      setLoadVideo(true);
    }
  }, [isIntersecting, loadVideo]);

  // Автопауза/автоплей по видимости + уважение reduce motion
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
        <source
          type="image/avif"
          srcSet={heroAvifSrcSet}
          sizes={heroImageSizes}
        />
        <source
          type="image/webp"
          srcSet={heroWebpSrcSet}
          sizes={heroImageSizes}
        />
        <img
          src={heroFallback}
          alt="Arti Clinic — лечение спины и суставов"
          loading="eager"
          decoding="async"
          width={1200}
          height={1600}
          onLoad={() => setPhotoReady(true)}
          className={styles.heroImg}
        />
      </picture>
    ),
    []
  );

  return (
    <header className={`${styles.hero} section`}>
      <img
        className={styles.bgPoster}
        src={heroVideoPoster}
        alt=""
        aria-hidden="true"
        width={854}
        height={480}
        loading="eager"
      />
      <video
        ref={videoRef}
        className={`${styles.bgVideo} ${videoReady ? styles.videoReady : ''}`}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        poster={heroVideoPoster}
        onPlaying={() => setVideoReady(true)}
        onError={() => setVideoReady(false)}
      >
        {loadVideo ? (
          <>
            <source src={heroVideoWebm} type="video/webm" />
            <source src={heroVideoMp4} type="video/mp4" />
          </>
        ) : null}
      </video>

      <div
        ref={ref}
        className={`container reveal ${isIntersecting ? 'is-visible' : ''}`}
      >
        <div className={styles.wrap}>
          <div className={`${styles.photoCard} ${photoReady ? styles.photoReady : ''}`} aria-hidden="true">
            {Picture}
          </div>
          <div className={styles.content}>
            <h1 className={styles.title}>
              ЛЕЧИМ БОЛИ В СПИНЕ И<br /> МЕЖПОЗВОНКОВЫЕ <br /> ГРЫЖИ <br />
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
