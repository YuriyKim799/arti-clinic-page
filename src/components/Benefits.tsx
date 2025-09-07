import React, { useEffect, useRef, useState } from 'react';
import styles from './Benefits.module.scss';
import { useInView } from '../useInView';

import vidWebm from '../assets/greeting-1080p.webm';
import vidMp4 from '@/assets/greeting-1080p.mp4';
import vidPoster from '@/assets/greeting-poster.jpg.jpg';

const items = [
  {
    title: 'Персональный план лечения',
    text: 'Каждому пациенту разрабатывается индивидуальный план, адаптированный под его уникальные потребности.',
  },
  {
    title: 'Современные методы и технологии',
    text: 'Мы используем передовые методики и новейшее оборудование, а наш опытный медицинский персонал гарантирует высокое качество лечения.',
  },
  {
    title: 'Комплексный подход каждому пациенту',
    text: 'Мы лечим не только симптомы, но и устраняем причины, обеспечивая долгосрочный результат.',
  },
  {
    title: 'Безоперационное лечение',
    text: 'Мы избавляем вас от боли и дискомфорта без необходимости хирургического вмешательства.',
  },
];

function VideoCard() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [muted, setMuted] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [focusLock, setFocusLock] = useState(false); // «режим просмотра» после клика
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    const initial = !!mq?.matches;
    setReducedMotion(initial);
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq?.addEventListener?.('change', onChange);
    return () => mq?.removeEventListener?.('change', onChange);
  }, []);

  // Автопауза, если карточка ушла из вьюпорта и не в «режиме просмотра»
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting && !focusLock) {
          v.pause();
          setPlaying(false);
        }
      },
      { threshold: 0.2 }
    );
    io.observe(v);
    return () => io.disconnect();
  }, [focusLock]);

  const safePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    v.play()
      .then(() => setPlaying(true))
      .catch(() => {
        /* ignore */
      });
  };

  const handleEnter = () => {
    if (reducedMotion || focusLock) return;
    const v = videoRef.current;
    if (!v) return;
    v.muted = true;
    setMuted(true);
    safePlay();
  };

  const handleLeave = () => {
    if (focusLock) return;
    const v = videoRef.current;
    if (!v) return;
    v.pause();
    setPlaying(false);
  };

  // Клик включает «режим просмотра» со звуком
  const toggleSoundAndLock = () => {
    const v = videoRef.current;
    if (!v) return;
    const nextMuted = !muted;
    v.muted = nextMuted;
    setMuted(nextMuted);
    setFocusLock(true);
    // при включении звука — точно играем
    safePlay();
  };

  // ESC — выход из «режима просмотра»
  const handleKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleSoundAndLock();
    }
    if (e.key === 'Escape' && focusLock) {
      e.preventDefault();
      setFocusLock(false);
      setMuted(true);
      const v = videoRef.current;
      if (v) v.controls = false;
    }
  };

  // Показываем контролы, когда в «режиме просмотра»
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.controls = focusLock;
  }, [focusLock]);

  return (
    <article
      className={`${styles.card} ${styles.videoCard}`}
      tabIndex={0}
      role="button"
      aria-label="Видео-приветствие от клиники"
      aria-pressed={focusLock}
      onMouseEnter={handleEnter}
      onFocus={handleEnter}
      onMouseLeave={handleLeave}
      onBlur={handleLeave}
      onKeyDown={handleKeyDown}
      onClick={toggleSoundAndLock}
    >
      <div className={styles.videoFrame}>
        <video
          ref={videoRef}
          className={styles.video}
          poster={vidPoster}
          loop
          preload="metadata"
          playsInline
          muted={muted}
        >
          <source src={vidWebm} type="video/webm" />
          <source src={vidMp4} type="video/mp4" />
        </video>

        <div className={styles.upperBadge}>Видео-приветствие</div>

        {/* глянец/обводка/виньетка */}
        <div className={styles.luxOverlay} />
        <div className={styles.vignette} />

        {/* Контрол в стиле «Chanel»: минималистичный круг, меняем иконку */}
        <button
          type="button"
          className={`${styles.premiumBtn} ${playing ? styles.isPlaying : ''} ${
            !muted ? styles.isUnmuted : ''
          }`}
          aria-label={muted ? 'Включить звук' : 'Выключить звук'}
          onClick={(e) => {
            e.stopPropagation();
            toggleSoundAndLock();
          }}
        >
          <span className={styles.btnRing} />
          <span className={styles.btnIcon} aria-hidden="true">
            {/* play/pause/volume icon via CSS (двумя псевдоэлементами) */}
          </span>
        </button>
      </div>
    </article>
  );
}

export const Benefits: React.FC = () => {
  const { ref, isIntersecting } = useInView<HTMLDivElement>();
  return (
    <section className={`section ${styles.section}`}>
      <div
        ref={ref}
        className={`container reveal ${isIntersecting ? 'is-visible' : ''}`}
      >
        <h2 className="section-title">Почему выбирают Арти Клиник</h2>
        <div className={styles.grid}>
          <VideoCard />
          {items.map((it, i) => (
            <article
              tabIndex={0}
              key={i}
              className={styles.card}
              aria-label={it.title}
            >
              <div className={styles.face}>
                <h3 className={styles.titleLayer}>{it.title}</h3>
                <p className={styles.textLayer}>{it.text}</p>
              </div>
            </article>
          ))}
          {/* пятая плитка — видео */}
        </div>
      </div>
    </section>
  );
};
