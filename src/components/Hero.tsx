import React, { useState, useRef, useEffect } from 'react';
import styles from './Hero.module.scss';
import { useInView } from '../useInView';
import WhatsAppButton from '@/components/WhatsAppButton/WhatsAppButton';
import TelegramButton from '@/components/TelegramButton/TelegramButton';
import RecordButton from './RecordButton/RecordButton';

import heroVideoWebm from '@/assets/hero-bg4.webm';
import heroVideoMp4 from '@/assets/hero-bg4.mp4';
import heroVideoPoster from '@/assets/hero-poster4.webp';
import heroMobileVideoWebm from '@/assets/hero-bg-mobile.webm';
import heroMobileVideoMp4 from '@/assets/hero-bg-mobile.mp4';
import heroMobileVideoPoster from '@/assets/hero-poster-mobile.webp';

// Совпадает с брейкпоинтом телефонов в Hero.module.scss.
const mobileHeroQuery = '(max-width: 630px)';

export const Hero: React.FC = () => {
  const { ref, isIntersecting } = useInView<HTMLDivElement>();
  const [loadVideo, setLoadVideo] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia(mobileHeroQuery).matches
  );
  const videoPoster = isMobile ? heroMobileVideoPoster : heroVideoPoster;

  useEffect(() => {
    const media = window.matchMedia(mobileHeroQuery);
    const updateVideo = () => {
      setVideoReady(false);
      setIsMobile(media.matches);
    };
    media.addEventListener('change', updateVideo);
    return () => media.removeEventListener('change', updateVideo);
  }, []);

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
  }, [isIntersecting, loadVideo, isMobile]);

  return (
    <header className={`${styles.hero} section`}>
      <img
        className={styles.bgPoster}
        src={videoPoster}
        alt=""
        aria-hidden="true"
        width={isMobile ? 720 : 854}
        height={isMobile ? 960 : 480}
        loading="eager"
      />
      <video
        key={isMobile ? 'mobile' : 'desktop'}
        ref={videoRef}
        className={`${styles.bgVideo} ${videoReady ? styles.videoReady : ''}`}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        poster={videoPoster}
        onPlaying={() => setVideoReady(true)}
        onError={() => setVideoReady(false)}
      >
        {loadVideo ? (
          <>
            <source src={isMobile ? heroMobileVideoWebm : heroVideoWebm} type="video/webm" />
            <source src={isMobile ? heroMobileVideoMp4 : heroVideoMp4} type="video/mp4" />
          </>
        ) : null}
      </video>

      <div
        ref={ref}
        className={`container reveal ${isIntersecting ? 'is-visible' : ''}`}
      >
        <div className={styles.wrap}>
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
