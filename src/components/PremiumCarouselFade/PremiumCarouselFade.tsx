import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from './PremiumCarouselFade.module.scss';

export type Slide = {
  src: string;
  alt?: string;
  caption?: string;
  thumbSrc?: string; // если не указать — возьмём src
};

type Props = {
  slides: Slide[];
  autoPlay?: boolean;
  autoPlayDelayMs?: number; // 4000
  transitionMs?: number; // 600 — длительность fade
  className?: string;
  aspectRatio?: `${number} / ${number}`; // по умолчанию 16 / 9
};

export default function PremiumCarouselFade({
  slides,
  autoPlay = true,
  autoPlayDelayMs = 4000,
  transitionMs = 600,
  className,
  aspectRatio = '16 / 9',
}: Props) {
  const [index, setIndex] = useState(0);
  const [isHover, setIsHover] = useState(false);
  const [drag, setDrag] = useState<{
    startX: number;
    deltaX: number;
    dragging: boolean;
  }>({
    startX: 0,
    deltaX: 0,
    dragging: false,
  });

  const rootRef = useRef<HTMLDivElement | null>(null);
  const progressRef = useRef<HTMLDivElement | null>(null);
  const timerRef = useRef<number | null>(null);

  const safeSlides = useMemo(() => slides.filter(Boolean), [slides]);
  const last = safeSlides.length - 1;

  // autoplay + visibility pause
  useEffect(() => {
    if (!autoPlay || safeSlides.length <= 1) return;
    const node = rootRef.current;
    let visible = true;

    const io = new IntersectionObserver(
      (entries) => {
        visible = entries[0]?.isIntersecting ?? true;
      },
      { threshold: 0.4 }
    );
    if (node) io.observe(node);

    const tick = () => {
      if (!visible || isHover || drag.dragging) return;
      setIndex((i) => (i === last ? 0 : i + 1));
    };

    timerRef.current = window.setInterval(tick, autoPlayDelayMs);

    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      io.disconnect();
    };
  }, [
    autoPlay,
    autoPlayDelayMs,
    isHover,
    drag.dragging,
    safeSlides.length,
    last,
  ]);

  // keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!rootRef.current) return;
      if (!rootRef.current.matches(':focus-within')) return;
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const next = () => setIndex((i) => (i === last ? 0 : i + 1));
  const prev = () => setIndex((i) => (i === 0 ? last : i - 1));

  // drag to change (даже при fade — просто жест для переключения)
  const onPointerDown: React.PointerEventHandler = (e) => {
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    setDrag({ startX: e.clientX, deltaX: 0, dragging: true });
  };
  const onPointerMove: React.PointerEventHandler = (e) => {
    if (!drag.dragging) return;
    setDrag((d) => ({ ...d, deltaX: e.clientX - d.startX }));
  };
  const onPointerUp: React.PointerEventHandler = () => {
    const threshold = (rootRef.current?.clientWidth || 1) * 0.12;
    if (drag.deltaX > threshold) prev();
    else if (drag.deltaX < -threshold) next();
    setDrag({ startX: 0, deltaX: 0, dragging: false });
  };

  if (!safeSlides.length) return null;

  return (
    <div
      ref={rootRef}
      className={[styles.root, className].filter(Boolean).join(' ')}
      onMouseEnter={() => setIsHover(true)}
      onMouseLeave={() => setIsHover(false)}
      role="region"
      aria-roledescription="carousel"
      aria-label="Фотографии клиники"
      style={{ ['--fadeMs' as any]: `${transitionMs}ms` }}
    >
      <div
        className={styles.viewport}
        style={{ aspectRatio }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onPointerLeave={drag.dragging ? onPointerUp : undefined}
      >
        {/* Стек слайдов (absolute), виден только активный (opacity:1) */}
        {safeSlides.map((s, i) => {
          const active = i === index;
          return (
            <figure
              key={i}
              className={[styles.slide, active ? styles.slideActive : '']
                .filter(Boolean)
                .join(' ')}
              aria-hidden={!active}
              tabIndex={-1}
            >
              <img
                src={s.src}
                alt={s.alt || ''}
                className={styles.image}
                loading={
                  i === index || i === (index + 1) % safeSlides.length
                    ? 'eager'
                    : 'lazy'
                }
                decoding="async"
              />
              {s.caption && (
                <figcaption className={styles.caption}>
                  <span>{s.caption}</span>
                </figcaption>
              )}
              <div className={styles.fxTop} aria-hidden />
              <div className={styles.fxBottom} aria-hidden />
            </figure>
          );
        })}

        <button
          type="button"
          className={[styles.nav, styles.prev].join(' ')}
          aria-label="Предыдущий слайд"
          onClick={prev}
        >
          ‹
        </button>
        <button
          type="button"
          className={[styles.nav, styles.next].join(' ')}
          aria-label="Следующий слайд"
          onClick={next}
        >
          ›
        </button>

        <div className={styles.progress} aria-hidden>
          <div
            key={index}
            className={styles.progressInner}
            style={{ ['--delay' as any]: `${autoPlayDelayMs}ms` }}
          />
        </div>
      </div>

      <div
        className={styles.thumbs}
        role="tablist"
        aria-label="Выбор слайда по миниатюрам"
      >
        {safeSlides.map((s, i) => {
          const active = i === index;
          return (
            <button
              key={i}
              role="tab"
              aria-selected={active}
              aria-label={`Слайд ${i + 1}`}
              className={[styles.thumb, active ? styles.thumbActive : '']
                .filter(Boolean)
                .join(' ')}
              onClick={() => setIndex(i)}
            >
              <img
                src={s.thumbSrc || s.src}
                alt={s.alt || `Миниатюра ${i + 1}`}
                loading="lazy"
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
