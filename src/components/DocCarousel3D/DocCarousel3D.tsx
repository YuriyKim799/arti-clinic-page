import React, { useEffect, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import styles from './DocCarousel3D.module.scss';

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
  radius?: number;
  panelWidth?: number;
  panelHeight?: number;
  thickness?: number;
  initialIndex?: number;
  className?: string;
};

const clampIndex = (index: number, length: number) =>
  ((index % length) + length) % length;

export default function DocCarousel3D({
  items,
  panelWidth = 520,
  panelHeight = 440,
  initialIndex = 0,
  className,
}: Props) {
  const count = items.length;
  const [active, setActive] = useState(() =>
    count > 0 ? clampIndex(initialIndex, count) : 0
  );
  const [opened, setOpened] = useState<number | null>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const lastX = useRef(0);
  const didSwipe = useRef(false);

  const activeItem = items[active];
  const openedItem = opened !== null ? items[opened] : null;

  useEffect(() => {
    if (count === 0) {
      setActive(0);
      setOpened(null);
      return;
    }

    setActive((current) => clampIndex(current, count));
    setOpened((current) => (current !== null && current >= count ? null : current));
  }, [count]);

  useEffect(() => {
    if (opened === null) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpened(null);
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [opened]);

  const canSlide = count > 1;

  const goTo = (index: number) => {
    if (count === 0) return;
    setActive(clampIndex(index, count));
  };

  const go = (direction: 1 | -1) => {
    if (!canSlide) return;
    setActive((current) => clampIndex(current + direction, count));
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!canSlide) return;
    isDragging.current = true;
    startX.current = event.clientX;
    lastX.current = event.clientX;
    didSwipe.current = false;
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!canSlide || !isDragging.current) return;
    lastX.current = event.clientX;
    if (Math.abs(lastX.current - startX.current) > 8) {
      didSwipe.current = true;
    }
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!canSlide || !isDragging.current) return;
    isDragging.current = false;
    const delta = lastX.current - startX.current;

    if (Math.abs(delta) < 44) return;
    go(delta < 0 ? 1 : -1);
  };

  const handlePointerCancel = () => {
    isDragging.current = false;
  };

  const openActive = () => {
    if (!activeItem || didSwipe.current) return;
    setOpened(active);
  };

  const previewLabel = useMemo(() => {
    if (!activeItem) return 'Документы';
    return activeItem.label || activeItem.alt || `Документ ${active + 1}`;
  }, [activeItem, active]);

  if (count === 0) {
    return (
      <div className={clsx(styles.wrapper, styles.empty, className)}>
        <div className={styles.emptyState}>Документы пока не добавлены</div>
      </div>
    );
  }

  return (
    <div
      className={clsx(styles.wrapper, className)}
      style={
        {
          '--panel-w': `${panelWidth}px`,
          '--panel-h': `${panelHeight}px`,
        } as React.CSSProperties
      }
      role="region"
      aria-label="Документы врача"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'ArrowLeft') go(-1);
        if (event.key === 'ArrowRight') go(1);
        if (event.key === 'Enter') openActive();
        if (event.key === 'Escape') setOpened(null);
      }}
    >
      <div className={styles.header}>
        <div className={styles.heading}>
          <span>Документы</span>
          <strong>{previewLabel}</strong>
        </div>
        <div className={styles.counter} aria-label={`Документ ${active + 1} из ${count}`}>
          {String(active + 1).padStart(2, '0')}
          <span>/</span>
          {String(count).padStart(2, '0')}
        </div>
      </div>

      <div
        className={styles.viewport}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
      >
        <div
          className={styles.track}
          style={{ transform: `translate3d(${-active * 100}%, 0, 0)` }}
        >
          {items.map((item, index) => (
            <div className={styles.slide} key={`${item.src}-${index}`}>
              <button
                type="button"
                className={styles.card}
                onClick={(event) => {
                  event.stopPropagation();
                  if (didSwipe.current) return;
                  setOpened(index);
                }}
                aria-label={item.alt || item.label || `Открыть документ ${index + 1}`}
                tabIndex={index === active ? 0 : -1}
              >
                <span className={styles.cardGlow} aria-hidden="true" />
                <span className={styles.frame} aria-hidden="true" />

                <span className={styles.imageShell}>
                  <img
                    src={item.src}
                    srcSet={item.srcSet}
                    sizes={item.sizes || `(min-width: 760px) ${panelWidth}px, 86vw`}
                    alt={item.alt || ''}
                    className={styles.image}
                    draggable={false}
                  />
                </span>

                {(item.tab || item.stampText) && (
                  <span className={styles.badges}>
                    {item.tab && <span className={styles.tab}>{item.tab}</span>}
                    {item.stampText && (
                      <span className={styles.stamp}>{item.stampText}</span>
                    )}
                  </span>
                )}

                <span className={styles.caption}>
                  <span>{item.label || `Документ ${index + 1}`}</span>
                  <small>Нажмите, чтобы открыть</small>
                </span>
              </button>
            </div>
          ))}
        </div>

        {canSlide && (
          <>
            <button
              type="button"
              className={clsx(styles.nav, styles.prev)}
              onClick={() => go(-1)}
              onPointerDown={(event) => event.stopPropagation()}
              onPointerMove={(event) => event.stopPropagation()}
              onPointerUp={(event) => event.stopPropagation()}
              aria-label="Предыдущий документ"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M15 6l-6 6 6 6"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                />
              </svg>
            </button>

            <button
              type="button"
              className={clsx(styles.nav, styles.next)}
              onClick={() => go(1)}
              onPointerDown={(event) => event.stopPropagation()}
              onPointerMove={(event) => event.stopPropagation()}
              onPointerUp={(event) => event.stopPropagation()}
              aria-label="Следующий документ"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M9 6l6 6-6 6"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                />
              </svg>
            </button>
          </>
        )}
      </div>

      {canSlide && (
        <div className={styles.dots} role="tablist" aria-label="Выбор документа">
          {items.map((item, index) => (
            <button
              key={`${item.src}-dot-${index}`}
              type="button"
              className={clsx(styles.dot, index === active && styles.dotActive)}
              onClick={() => goTo(index)}
              aria-label={item.label || `Документ ${index + 1}`}
              aria-selected={index === active}
              role="tab"
            />
          ))}
        </div>
      )}

      {openedItem && (
        <div className={styles.modal} role="dialog" aria-modal="true">
          <div className={styles.lightbox} onClick={() => setOpened(null)}>
            <div
              className={styles.lightboxInner}
              onClick={(event) => event.stopPropagation()}
            >
              <img
                src={openedItem.src}
                srcSet={openedItem.srcSet}
                sizes={openedItem.sizes}
                alt={openedItem.alt || ''}
                className={styles.preview}
              />
              <div className={styles.meta}>
                <div className={styles.metaTitle}>
                  {openedItem.label || 'Документ'}
                </div>
                <div className={styles.metaActions}>
                  {openedItem.href && (
                    <a
                      href={openedItem.href}
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
        </div>
      )}
    </div>
  );
}
