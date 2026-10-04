import React, { useEffect, useRef, useState } from 'react';
import styles from './Benefits.module.scss';
import { useInView } from '../useInView';

import vidWebm from '../assets/greeting-1080p.webm';
import vidMp4 from '@/assets/greeting-1080p.mp4';
import vidPoster from '@/assets/reverse-greeting-image.jpeg';
import treatmentWebm from '@/assets/personal-treatment-plan.webm';
import treatmentMp4 from '@/assets/personal-treatment-plan.mp4';
import treatmentPoster from '@/assets/personal-treatment-plan-poster.webp';
import methodsWebm from '@/assets/modern-treatment-methods.webm';
import methodsMp4 from '@/assets/modern-treatment-methods.mp4';
import methodsPoster from '@/assets/modern-treatment-methods-poster.webp';
import comprehensiveWebm from '@/assets/comprehensive-patient-care.webm';
import comprehensiveMp4 from '@/assets/comprehensive-patient-care.mp4';
import comprehensivePoster from '@/assets/comprehensive-patient-care-poster.webp';

const items = [
  {
    title: 'Персональный план лечения',
    video: { webm: treatmentWebm, mp4: treatmentMp4, poster: treatmentPoster },
  },
  {
    title: 'Современные методы и технологии',
    video: { webm: methodsWebm, mp4: methodsMp4, poster: methodsPoster },
  },
  {
    title: 'Комплексный подход к каждому пациенту',
    video: { webm: comprehensiveWebm, mp4: comprehensiveMp4, poster: comprehensivePoster },
  },
  {
    title: 'Безоперационное лечение',
    text: 'Мы избавляем Вас от боли и дискомфорта без необходимости хирургического вмешательства.',
  },
];

const updateWaveOrigin: React.PointerEventHandler<HTMLElement> = (event) => {
  const rect = event.currentTarget.getBoundingClientRect();
  event.currentTarget.style.setProperty('--wave-x', `${event.clientX - rect.left}px`);
  event.currentTarget.style.setProperty('--wave-y', `${event.clientY - rect.top}px`);
};

function BenefitVideoCard({ title, video: media }: {
  title: string;
  video: { webm: string; mp4: string; poster: string };
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    let cancelled = false;
    if (active) {
      video.play().then(() => {
        if (cancelled) video.pause();
      }).catch(() => {});
    } else {
      video.pause();
      video.currentTime = 0;
    }
    return () => {
      cancelled = true;
      video.pause();
    };
  }, [active]);

  return (
    <article className={`${styles.card} ${styles.treatmentCard}`}>
      <button
        type="button"
        className={`${styles.treatmentTrigger} ${active ? styles.treatmentActive : ''}`}
        aria-label={`${title}: видеопревью`}
        aria-pressed={active}
        onPointerEnter={(event) => {
          if (event.pointerType === 'mouse') setActive(true);
        }}
        onPointerLeave={(event) => {
          if (event.pointerType === 'mouse') setActive(false);
        }}
        onFocus={(event) => {
          if (event.currentTarget.matches(':focus-visible')) setActive(true);
        }}
        onBlur={() => setActive(false)}
        onClick={() => setActive((value) => !value)}
        onKeyDown={(event) => {
          if (event.key === 'Escape') setActive(false);
        }}
      >
        <span className={styles.treatmentTitle}>{title}</span>
        <video
          ref={videoRef}
          className={styles.treatmentVideo}
          poster={media.poster}
          preload="none"
          muted
          loop
          playsInline
          aria-hidden="true"
        >
          <source src={media.webm} type="video/webm" />
          <source src={media.mp4} type="video/mp4" />
        </video>
      </button>
    </article>
  );
}

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
          preload="none"
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
        <h2 className="section-title">Почему выбирают Арти Клиник ?</h2>
        <div className={styles.grid}>
          <VideoCard />
          {items.map((it, i) => {
            if (it.video) return <BenefitVideoCard key={it.title} title={it.title} video={it.video} />;
            const hasClickHint = i === items.length - 1;

            return (
              <article
                tabIndex={0}
                key={i}
                className={`${styles.card} ${hasClickHint ? styles.clickHintCard : ''}`}
                aria-label={it.title}
                onPointerMove={hasClickHint ? updateWaveOrigin : undefined}
                onPointerEnter={hasClickHint ? updateWaveOrigin : undefined}
              >
                <div className={styles.face}>
                  <h3 className={styles.titleLayer}>{it.title}</h3>
                  <p className={styles.textLayer}>{it.text}</p>
                </div>
              </article>
            );
          })}
          {/* пятая плитка — видео */}
        </div>
      </div>
    </section>
  );
};
