import React, { useEffect, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import styles from './DocCarousel3D.module.scss';

export type DocItem = {
  src: string;
  srcSet?: string; // для ретины/2x
  sizes?: string; // <source sizes>
  alt?: string;
  href?: string;
  label?: string;
  tab?: string;
  stampText?: string;
};

type Props = {
  items: DocItem[];
  radius?: number; // можно оставить как есть: авто-радиус посчитает минимум
  panelWidth?: number;
  panelHeight?: number;
  thickness?: number;
  initialIndex?: number;
  className?: string;
};

const clampIndex = (i: number, n: number) => ((i % n) + n) % n;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const calcMinRadius = (w: number, n: number, gap = 28) =>
  n < 3 ? w * 1.2 : w / 2 / Math.tan(Math.PI / n) + gap;

function useBreakpoint() {
  const getW = () => (typeof window === 'undefined' ? 1200 : window.innerWidth);
  const [w, setW] = useState<number>(getW());
  useEffect(() => {
    const onR = () => setW(getW());
    window.addEventListener('resize', onR, { passive: true });
    return () => window.removeEventListener('resize', onR);
  }, []);
  if (w < 480) return 'xs';
  if (w < 768) return 'sm';
  if (w < 1024) return 'md';
  return 'lg';
}

export default function DocCarousel3D({
  items,
  radius = 360,
  panelWidth = 400,
  panelHeight = 320,
  thickness = 111,
  initialIndex = 1,
  className,
}: Props) {
  const bp = useBreakpoint();
  const scale = bp === 'xs' ? 0.66 : bp === 'sm' ? 0.78 : bp === 'md' ? 0.9 : 1;

  const PW = Math.round(panelWidth * scale);
  const PH = Math.round(panelHeight * scale);
  const n = items.length;
  const step = 360 / n;
  // авто-радиус, чтобы панели не перекрывались
  const R = useMemo(
    () => Math.max(radius, calcMinRadius(panelWidth, n)),
    [radius, panelWidth, n]
  );

  const ringRef = useRef<HTMLDivElement>(null);

  const [active, setActive] = useState(clampIndex(initialIndex, n));
  const [opened, setOpened] = useState<number | null>(null);
  const [isHoverAny, setIsHoverAny] = useState(false);

  useEffect(() => {
    if (opened === null) return;
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpened(null);
    };
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [opened]);

  // угол кольца (градусы)
  const angleRef = useRef<number>(-active * step);
  const targetRef = useRef<number>(-active * step);
  const rafRef = useRef<number | null>(null);

  // drag state
  const draggingRef = useRef(false);
  const dragStartX = useRef(0);
  const dragStartTarget = useRef(0);
  const dragMoved = useRef(false);

  // медленнее и плавнее
  const sensitivity = 0.1; // deg/px
  const snapEase = 0.1; // плавность подлёта
  const WHEEL_STEP = 0.15; // доля шага при прокрутке

  const applyAngle = (deg: number) => {
    if (ringRef.current) {
      ringRef.current.style.transform = `translateZ(-${R}px) rotateY(${deg}deg)`;
    }
  };

  useEffect(() => {
    const loop = () => {
      const a = angleRef.current;
      const t = targetRef.current;
      const next = Math.abs(t - a) < 0.01 ? t : lerp(a, t, snapEase);
      angleRef.current = next;
      applyAngle(next);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [R, snapEase]);

  useEffect(() => {
    targetRef.current = -active * step;
  }, [active, step]);

  const snapToNearest = () => {
    const raw = -targetRef.current / step;
    const idx = clampIndex(Math.round(raw), n);
    setActive(idx);
    targetRef.current = -idx * step;
  };

  const snapTimer = useRef<number | null>(null);
  const scheduleSnap = (ms = 160) => {
    if (snapTimer.current) window.clearTimeout(snapTimer.current);
    snapTimer.current = window.setTimeout(() => {
      snapToNearest();
      snapTimer.current = null;
    }, ms);
  };

  // Колесо: медленнее и предсказуемо
  const onWheel = (e: React.WheelEvent) => {
    if (opened !== null) return;
    e.preventDefault();
    const dir = Math.sign(e.deltaY) || 1;
    targetRef.current += dir * step * WHEEL_STEP;
    scheduleSnap(120);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (opened !== null) return;

    draggingRef.current = true;
    dragMoved.current = false;
    dragStartX.current = e.clientX;
    dragStartTarget.current = targetRef.current;

    // window-level move/up — не ломают "click" по панели
    const move = (ev: PointerEvent) => {
      if (!draggingRef.current) return;
      const dx = ev.clientX - dragStartX.current; // влево — dx < 0
      if (Math.abs(dx) > 4) dragMoved.current = true;
      targetRef.current = dragStartTarget.current + dx * sensitivity; // контент следует за пальцем
    };

    const up = () => {
      if (!draggingRef.current) return;
      draggingRef.current = false;
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      scheduleSnap();
    };

    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  const go = (dir: 1 | -1) => {
    if (opened !== null) return;
    setActive((i) => clampIndex(i + dir, n));
  };

  const onPanelClick = (idx: number) => {
    if (opened !== null) return;
    if (dragMoved.current) return;
    setOpened(idx);
  };
  const closeOpened = () => setOpened(null);

  const palette = useMemo(
    () => ({
      paper: '#fcfcfb',
      frame: '#3a3f46',
      tab: '#e7e7ea',
      stamp: '#e04848',
    }),
    []
  );

  return (
    <div
      className={clsx(styles.wrapper, className)}
      style={
        {
          '--w': `${panelWidth}px`,
          '--h': `${panelHeight}px`,
          '--t': `${thickness}px`,
          '--r': `${R}px`,
          '--paper': palette.paper,
          '--frame': palette.frame,
          '--tab': palette.tab,
          '--stamp': palette.stamp,
        } as React.CSSProperties
      }
      onWheel={onWheel}
      onPointerDown={onPointerDown}
      tabIndex={0}
      role="region"
      aria-label="Документы врача — 3D карусель"
      onKeyDown={(e) => {
        if (e.key === 'ArrowLeft') go(-1);
        if (e.key === 'ArrowRight') go(1);
        if (e.key === 'Escape') closeOpened();
        if (e.key === 'Enter') setOpened(active);
      }}
    >
      <div className={styles.baseShadow} />
      <button
        className={clsx(styles.nav, styles.left)}
        aria-label="Назад"
        onClick={() => go(-1)}
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

      <div className={styles.scene}>
        <div
          className={styles.ring}
          ref={ringRef}
          onMouseEnter={() => setIsHoverAny(true)}
          onMouseLeave={() => setIsHoverAny(false)}
        >
          {items.map((it, i) => {
            const phi = i * step;
            const isFront = i === active;
            const isOpen = opened === i;
            return (
              <div
                className={styles.pivot}
                key={i}
                style={{
                  transform: `translate(-50%, -50%) rotateY(${phi}deg) translateZ(var(--r))`,
                }}
              >
                <button
                  type="button"
                  className={clsx(
                    styles.panel,
                    isFront && styles.front,
                    isOpen && styles.open,
                    isHoverAny && styles.hasHover
                  )}
                  onClick={() => onPanelClick(i)}
                  aria-label={it.alt || it.label || `Документ ${i + 1}`}
                >
                  <span className={styles.edge} />
                  {it.tab && <span className={styles.tab}>{it.tab}</span>}
                  {it.stampText && (
                    <span className={styles.stamp}>{it.stampText}</span>
                  )}
                  <img
                    src={it.src}
                    srcSet={it.srcSet}
                    sizes={
                      it.sizes || `(min-width: 640px) ${panelWidth}px, 88vw`
                    }
                    alt={it.alt || ''}
                    className={styles.paper}
                    draggable={false}
                  />
                  {it.label && (
                    <span className={styles.caption}>{it.label}</span>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {opened !== null && (
        <div className={styles.modal} role="dialog" aria-modal="true">
          <div className={styles.lightbox} onClick={closeOpened}>
            <div
              className={styles.lightboxInner}
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={items[opened].src}
                srcSet={items[opened].srcSet}
                sizes={items[opened].sizes}
                alt={items[opened].alt || ''}
                className={styles.preview}
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
                onClick={closeOpened}
                aria-label="Закрыть"
                type="button"
              >
                x
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
