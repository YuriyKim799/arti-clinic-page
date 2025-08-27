import React, { useState, useRef, useEffect } from 'react';
import styles from './Hero.module.scss';
import { useInView } from '../useInView';
import heroVideo from '../assets/hero-bg.mp4';
import WhatsAppButton from '@/components/WhatsAppButton/WhatsAppButton';
import TelegramButton from '@/components/TelegramButton/TelegramButton';
import RecordButton from './RecordButton/RecordButton';

import heroFallback from '@/assets/hero-doctor.png';
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
  // ленивое подключение <source> только при входе во вьюпорт
  const [loadVideo, setLoadVideo] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (isIntersecting && !loadVideo) {
      setLoadVideo(true); // подставим src у <source> (см. ниже)
    }

    const v = videoRef.current;
    if (!v) return;

    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;
    if (isIntersecting && !prefersReduced) {
      // попытка автоплея только когда виден
      v.play().catch(() => {});
    } else {
      // уехали из вьюпорта или reduce motion — ставим на паузу
      if (!v.paused) v.pause();
    }
  }, [isIntersecting, loadVideo]);

  return (
    <header className={`${styles.hero} section`}>
      <video
        ref={videoRef}
        className={`${styles.bgVideo} ${ready ? styles.ready : ''}`}
        preload="none"
        muted
        loop
        playsInline
        onCanPlay={() => setReady(true)}
      >
        {loadVideo && <source src={heroVideo} type="video/mp4" />}
      </video>
      <div
        ref={ref}
        className={`container reveal ${isIntersecting ? 'is-visible' : ''}`}
      >
        <div className={styles.wrap}>
          <div className={styles.photoCard} aria-hidden="true">
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
