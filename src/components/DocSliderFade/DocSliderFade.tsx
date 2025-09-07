import React, { useEffect, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import styles from '@/components/DocSliderFade/DocSliderFade.module.scss';

export type DocItem = {
  src: string;
  srcSet?: string;
  sizes?: string;
  alt?: string;
  href?: string;
  label?: string;
  tab?: string;
  stampText?: string;
};

type Props = {
  items: DocItem[];
  panelWidth?: number; // логич. ширина «карточки» (используем как хинт)
  panelHeight?: number; // высота «карточки»
  intervalMs?: number; // авто-переход
  startIndex?: number;
  className?: string;
};

export default function DocSliderFade({
  items,
  panelWidth = 360,
  panelHeight = 420,
  intervalMs = 4200,
  startIndex = 0,
  className,
}: Props) {
  const n = items.length;
  const [idx, setIdx] = useState(Math.max(0, Math.min(startIndex, n - 1)));
  const [paused, setPaused] = useState(false);
  const [opened, setOpened] = useState<number | null>(null);

  // авто-плей (пауза при ховере/модалке/1 слайд)
  useEffect(() => {
    if (paused || opened !== null || n < 2) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % n), intervalMs);
    return () => clearInterval(t);
  }, [paused, opened, n, intervalMs]);

  const go = (dir: 1 | -1) => setIdx((i) => (i + dir + n) % n);
  const dots = useMemo(() => Array.from({ length: n }, (_, i) => i), [n]);

  // клавиатура
  const wrapRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const onKey = (e: KeyboardEvent) => {
      if (opened !== null) return;
      if (e.key === 'ArrowLeft') go(-1);
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'Enter') setOpened(idx);
    };
    el.addEventListener('keydown', onKey);
    return () => el.removeEventListener('keydown', onKey);
  }, [idx, opened]);

  // простая обработка свайпа
  const startX = useRef<number | null>(null);
  const moved = useRef(false);

  const onStagePointerDown = (e: React.PointerEvent) => {
    // только ЛКМ/палец
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    startX.current = e.clientX;
    moved.current = false;
  };
  const onStagePointerMove = (e: React.PointerEvent) => {
    if (startX.current == null) return;
    const dx = e.clientX - startX.current;
    if (Math.abs(dx) > 12) moved.current = true;
  };
  const onStagePointerUp = (e: React.PointerEvent) => {
    if (startX.current == null) return;
    const dx = e.clientX - startX.current;
    if (Math.abs(dx) > 40) go(dx > 0 ? -1 : 1);
    startX.current = null;
  };
  const onStagePointerCancel = () => {
    startX.current = null;
  };

  const palette = {
    paper: '#fcfcfb',
    tab: '#e7e7ea',
    stamp: '#e04848',
  };

  return (
    <div
      ref={wrapRef}
      className={clsx(styles.wrap, className)}
      style={
        {
          '--w': `${panelWidth}px`,
          '--h': `${panelHeight}px`,
          '--paper': palette.paper,
          '--tab': palette.tab,
          '--stamp': palette.stamp,
        } as React.CSSProperties
      }
      role="region"
      aria-label="Документы — слайдер"
      tabIndex={0}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* <div className={styles.frameGlow} aria-hidden="true" /> */}
      <div
        className={styles.stage}
        onPointerDown={onStagePointerDown}
        onPointerMove={onStagePointerMove}
        onPointerUp={onStagePointerUp}
        onPointerCancel={onStagePointerCancel}
      >
        {items.map((it, i) => (
          <figure
            key={i}
            className={clsx(styles.slide, i === idx && styles.active)}
            onClick={() => {
              if (!moved.current) setOpened(idx);
            }}
          >
            {it.tab && <span className={styles.tab}>{it.tab}</span>}
            {it.stampText && (
              <span className={styles.stamp}>{it.stampText}</span>
            )}
            <img
              className={styles.paper}
              src={it.src}
              srcSet={it.srcSet}
              sizes={it.sizes || `(min-width: 640px) ${panelWidth}px, 88vw`}
              alt={it.alt || it.label || `Документ ${i + 1}`}
              draggable={false}
            />
            {it.label && (
              <figcaption className={styles.caption}>{it.label}</figcaption>
            )}
          </figure>
        ))}
      </div>

      {n > 1 && (
        <>
          <button
            className={clsx(styles.nav, styles.left)}
            aria-label="Назад"
            onClick={() => go(-1)}
            onPointerDown={(e) => e.stopPropagation()} // не стартуем свайп
            type="button"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M15 6l-6 6 6 6"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <button
            className={clsx(styles.nav, styles.right)}
            aria-label="Вперёд"
            onClick={() => go(1)}
            onPointerDown={(e) => e.stopPropagation()} // не стартуем свайп
            type="button"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M9 6l6 6-6 6"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          <div
            className={styles.dots}
            role="tablist"
            aria-label="Навигация по документам"
          >
            {dots.map((d) => (
              <button
                key={d}
                className={clsx(styles.dot, d === idx && styles.dotActive)}
                aria-label={`Перейти к документу ${d + 1}`}
                aria-selected={d === idx}
                role="tab"
                onClick={() => setIdx(d)}
                onPointerDown={(e) => e.stopPropagation()} // и здесь тоже
                type="button"
              />
            ))}
          </div>
        </>
      )}

      {opened !== null && (
        <div
          className={styles.modal}
          role="dialog"
          aria-modal="true"
          onClick={() => setOpened(null)}
        >
          <div className={styles.lightbox} onClick={(e) => e.stopPropagation()}>
            <img
              className={styles.preview}
              src={items[opened].src}
              srcSet={items[opened].srcSet}
              sizes={items[opened].sizes}
              alt={items[opened].alt || items[opened].label || 'Документ'}
            />
            <div className={styles.meta}>
              <div className={styles.metaTitle}>
                {items[opened].label || 'Документ'}
              </div>
              <div className={styles.metaRow}>
                {items[opened].tab && <span>{items[opened].tab}</span>}
                {items[opened].href && (
                  <a
                    href={items[opened].href}
                    target="_blank"
                    rel="noreferrer noopener"
                    className={styles.link}
                  >
                    Открыть оригинал
                  </a>
                )}
              </div>
            </div>
            <button
              className={styles.close}
              onClick={() => setOpened(null)}
              aria-label="Закрыть"
              type="button"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
