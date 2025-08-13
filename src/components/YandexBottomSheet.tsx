import React, { useEffect, useRef, useState } from 'react';
import styles from './YandexBottomSheet.module.scss';

type Props = {
  orgId: string; // 19149709238
  title?: string;
  subtitle?: string;
  rating?: number; // 4.9
  count?: number; // 132
  showComments?: boolean;
};

export const YandexBottomSheet: React.FC<Props> = ({
  orgId,
  title = 'Отзывы пациентов',
  subtitle = 'Реальные оценки и комментарии о лечении в Arti Clinic',
  rating = 4.9,
  count = 132,
  showComments = true,
}) => {
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLIFrameElement>(null);

  // подгружаем iframe только при первом открытии
  useEffect(() => {
    if (!open || loaded || !frameRef.current) return;
    const base = `https://yandex.ru/maps-reviews-widget/${orgId}`;
    frameRef.current.src = base + (showComments ? '?comments' : '');
  }, [open, loaded, orgId, showComments]);

  // esc для закрытия
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    open && document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  // drag-to-close (тач/мышь)
  useEffect(() => {
    const el = sheetRef.current;
    if (!el) return;
    let startY = 0,
      delta = 0,
      dragging = false;

    const onDown = (e: PointerEvent) => {
      dragging = true;
      startY = e.clientY;
      delta = 0;
      el.style.transition = 'none';
      el.setPointerCapture(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      delta = e.clientY - startY;
      if (delta > 0) el.style.transform = `translateY(${delta}px)`;
    };
    const onUp = () => {
      if (!dragging) return;
      dragging = false;
      el.style.transition = '';
      if (delta > 120) setOpen(false);
      else el.style.transform = '';
    };

    el.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      el.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [open]);

  return (
    <section className={styles.section}>
      {/* Тизер */}
      <div className={styles.teaser}>
        <div className={styles.head}>
          <div className={styles.badge}>
            <span className={styles.dot} aria-hidden /> Отзывы
          </div>
          <h2 className={styles.title}>{title}</h2>
          <p className={styles.subtitle}>{subtitle}</p>
        </div>

        <div className={styles.row}>
          <div className={styles.stars} aria-label={`Рейтинг ${rating} из 5`}>
            {Array.from({ length: 5 }).map((_, i) => (
              <span
                key={i}
                className={
                  i < Math.round(rating) ? styles.starFull : styles.starEmpty
                }
              >
                ★
              </span>
            ))}
          </div>
          <div className={styles.score}>
            <strong>{rating.toFixed(1)}</strong>
            <span className={styles.muted}>/ 5</span>
            <span className={styles.sep} />
            <span className={styles.muted}>{count} отзывов</span>
          </div>
          <div className={styles.actions}>
            <button className={styles.btnPrimary} onClick={() => setOpen(true)}>
              Читать отзывы
              <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
                <path
                  d="M5 12h12"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
                <path
                  d="M12 5l7 7-7 7"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <a
              className={styles.btnGhost}
              href={`https://yandex.ru/maps/org/arti_klinik/${orgId}/reviews/`}
              target="_blank"
              rel="noopener"
            >
              Оставить отзыв
            </a>
          </div>
        </div>
      </div>

      {/* Bottom Sheet */}
      {open && (
        <div
          className={styles.modal}
          role="dialog"
          aria-modal="true"
          aria-label="Отзывы на Яндекс.Картах"
        >
          <div className={styles.backdrop} onClick={() => setOpen(false)} />
          <div className={styles.sheet} ref={sheetRef}>
            <div className={styles.grabber} aria-hidden />
            <div className={styles.sheetHead}>
              <h3>Отзывы на Яндекс.Картах</h3>
              <button
                className={styles.close}
                aria-label="Закрыть"
                onClick={() => setOpen(false)}
              >
                ✕
              </button>
            </div>

            <div className={styles.frameWrap}>
              {!loaded && <div className={styles.skeleton} />}
              <iframe
                ref={frameRef}
                title="Отзывы Arti Clinic — Яндекс.Карты"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                onLoad={() => setLoaded(true)}
              />
              <a
                className={styles.credit}
                href={`https://yandex.ru/maps/org/arti_klinik/${orgId}/`}
                target="_blank"
                rel="noopener"
              >
                Арти клиник на карте Москвы — Яндекс Карты
              </a>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default YandexBottomSheet;
