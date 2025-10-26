import React, { useState, useRef, useEffect, useMemo } from 'react';
import styles from './Hero.module.scss';
import { useInView } from '../useInView';
import WhatsAppButton from '@/components/WhatsAppButton/WhatsAppButton';
import TelegramButton from '@/components/TelegramButton/TelegramButton';
import RecordButton from './RecordButton/RecordButton';

import heroFallback from '@/assets/hero-doctor.png';
import heroVideoDefault from '../assets/hero-bg.mp4';

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

export const Hero: React.FC = () => {
  const { ref, isIntersecting } = useInView<HTMLDivElement>();
  const [ready, setReady] = useState(false);
  const [loadVideo, setLoadVideo] = useState(false);
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
        preload="metadata" // постера нет
        onLoadedData={() => setReady(true)} // показываем, как только доступен первый кадр
      >
        {loadVideo ? <source src={heroVideoDefault} type="video/mp4" /> : null}
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
