import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from './YandexReviewsFloating.module.scss';

type Props = {
  orgId: string;
  title?: string;
  subtitle?: string;
  orgLink?: string;
  className?: string;
  /** компактный режим — ниже по высоте */
  compact?: boolean;
  /** показать правую панель с рейтингом/CTA */
  showSideInfo?: boolean;
  /** статический рейтинг для отображения в сайд-панели */
  rating?: number; // например 4.9
  reviewsCount?: number; // например 128
};

export const YandexReviewsFloating: React.FC<Props> = ({
  orgId,
  title = 'Отзывы пациентов',
  subtitle = 'Яндекс.Карты · официальные отзывы',
  orgLink,
  className = '',
  compact = true,
  showSideInfo = true,
  rating = 5,
  reviewsCount = 100,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin: '200px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const iframeSrc = useMemo(
    () =>
      visible
        ? `https://yandex.ru/maps-reviews-widget/${orgId}?comments`
        : undefined,
    [visible, orgId]
  );

  const link = orgLink || `https://yandex.ru/maps/org/arti_klinik/${orgId}/`;

  return (
    <section
      id="reviews"
      className={`section ${styles.wrap} ${className}`}
      aria-label="Отзывы пациентов (Яндекс.Карты)"
    >
      <div className={`container ${styles.container}`}>
        <header className={styles.header}>
          <h2 className={`section-title ${styles.title}`}>{title}</h2>
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </header>

        <div ref={containerRef} className={styles.card}>
          {/* декоративная световая полоса — очень деликатная анимация */}
          <div className={styles.glow} aria-hidden="true" />

          <div className={styles.grid}>
            {/* Левая зона с виджетом */}
            <div
              className={`${styles.frame} ${
                compact ? styles.frameCompact : ''
              }`}
            >
              {!loaded && (
                <div className={styles.skeleton} aria-hidden="true">
                  <div className={styles.shimmer} />
                </div>
              )}
              <iframe
                title="Отзывы на Яндекс.Картах"
                src={iframeSrc}
                className={styles.iframe}
                loading="lazy"
                onLoad={() => setLoaded(true)}
                referrerPolicy="no-referrer-when-downgrade"
              />

              <button
                type="button"
                className={styles.expandBtn}
                onClick={() => setExpanded(true)}
              >
                Развернуть
              </button>
            </div>

            {/* Правая инфо-панель — заполняет «пустоту справа» */}
            {showSideInfo && (
              <aside className={styles.side}>
                <div className={styles.badge}>Проверенные отзывы</div>

                <div
                  className={styles.ratingBlock}
                  aria-label={`Рейтинг ${rating} из 5`}
                >
                  <div className={styles.stars} aria-hidden="true">
                    {Array.from({ length: 5 }).map((_, i) => {
                      const filled = i < Math.round(rating);
                      return (
                        <svg
                          key={i}
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          width="16"
                          height="16"
                          fill={filled ? '#FFD700' : '#E0E0E0'}
                        >
                          <path
                            d="M12 .587l3.668 7.431 8.2 1.192-5.934 5.782 
                 1.402 8.173L12 18.896l-7.336 3.854 
                 1.402-8.173L.132 9.21l8.2-1.192L12 .587z"
                          />
                        </svg>
                      );
                    })}
                  </div>
                  <div className={styles.ratingRow}>
                    <span className={styles.ratingValue}>
                      {rating.toFixed(1)}
                    </span>
                    <span className={styles.ratingCount}>
                      · {reviewsCount}+ отзывов
                    </span>
                  </div>
                </div>

                <a
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.cta}
                >
                  Открыть на Яндекс.Картах
                </a>

                <p className={styles.micro}>
                  Отзывы загружаются напрямую из Яндекс.Карт. Мы не редактируем
                  содержание.
                </p>
              </aside>
            )}
          </div>
        </div>
      </div>

      {/* Модалка полноэкранного просмотра */}
      {expanded && (
        <div
          className={styles.modal}
          role="dialog"
          aria-modal="true"
          aria-label="Отзывы — полноэкранный просмотр"
        >
          <div
            className={styles.modalBackdrop}
            onClick={() => setExpanded(false)}
          />
          <div className={styles.modalBody}>
            <button
              className={styles.modalClose}
              onClick={() => setExpanded(false)}
              aria-label="Закрыть"
            >
              ×
            </button>
            <div className={styles.modalFrame}>
              <iframe
                title="Отзывы на Яндекс.Картах (полноэкранный режим)"
                src={`https://yandex.ru/maps-reviews-widget/${orgId}?comments`}
                className={styles.modalIframe}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
              <a
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.modalAttr}
              >
                Арти Клиник на карте Москвы — Яндекс Карты
              </a>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
