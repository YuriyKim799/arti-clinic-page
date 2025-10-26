import React, { useEffect, useState } from 'react';
import styles from './CookieConsentModal.module.scss';

type ConsentState = 'unknown' | 'accepted' | 'rejected';
const LS_KEY = 'cookie-consent-v1';

/** опциональная загрузка Яндекс.Метрики */
function loadYandexMetrica(id?: number) {
  return;
}

export default function CookieSimpleBanner({
  yandexMetricaId,
  privacyHref = '/politic',
}: {
  yandexMetricaId?: number;
  privacyHref?: string;
}) {
  const [state, setState] = useState<ConsentState>('unknown');

  useEffect(() => {
    const saved = localStorage.getItem(LS_KEY);
    if (saved === 'accepted') {
      setState('accepted');
      loadYandexMetrica(yandexMetricaId);
    } else if (saved === 'rejected') {
      setState('rejected');
    } else {
      setState('unknown');
    }
  }, [yandexMetricaId]);

  const accept = () => {
    localStorage.setItem(LS_KEY, 'accepted');
    setState('accepted');
    loadYandexMetrica(yandexMetricaId);
  };

  const reject = () => {
    localStorage.setItem(LS_KEY, 'rejected');
    setState('rejected');
  };

  if (state !== 'unknown') return null;

  return (
    <div
      className={styles.wrap}
      role="dialog"
      aria-label="Согласие на использование cookies"
    >
      <div className={styles.inner}>
        <p className={styles.text}>
          Мы используем cookies для работы сайта и аналитики.
          <a
            className={styles.link}
            href={privacyHref}
            target="_blank"
            rel="noopener noreferrer"
          >
            Подробнее
          </a>
        </p>
        <div className={styles.actions}>
          <button className={styles.secondary} onClick={reject}>
            Отказаться
          </button>
          <button className={styles.primary} onClick={accept}>
            Принять всё
          </button>
        </div>
      </div>
    </div>
  );
}
