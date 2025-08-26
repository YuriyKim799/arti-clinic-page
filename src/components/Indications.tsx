import React from 'react';
import styles from './Indications.module.scss';
import { useInView } from '../useInView';
import RecordButton from './RecordButton/RecordButton';

export type IndicationsProps = {
  titleVariant?: 'emotional' | 'clinical';
  title?: string;
  subtitle?: string;
  ctaLabel?: string;
  onCtaClick?: () => void;
  items?: string[];
  id?: string;
};

const DEFAULT_ITEMS = [
  'Боли в спине',
  'Грыжа межпозвонкового диска',
  'Боль в шее',
  'Боль в суставах',
  'Сколиоз',
  'Реабилитация после травм',
  'Пяточная шпора',
  'Лечебный массаж',
  'Профилактика нарушений ОДА',
];

export const Indications: React.FC<IndicationsProps> = ({
  titleVariant = 'emotional',
  title,
  subtitle,
  ctaLabel = 'Записаться на приём',
  onCtaClick,
  items = DEFAULT_ITEMS,
  id,
}) => {
  const { ref, isIntersecting } = useInView<HTMLDivElement>();
  const { ref: listRef, isIntersecting: listVisible } =
    useInView<HTMLUListElement>();

  const computedTitle =
    title ??
    (titleVariant === 'clinical'
      ? 'Показания для обращения'
      : 'Жизнь без боли — реально');

  const computedSubtitle =
    subtitle ??
    (titleVariant === 'clinical'
      ? 'С этими состояниями к нам обращаются чаще всего'
      : 'Помогаем при болях в спине, суставах, шее и после травм');

  return (
    <section
      id={id}
      className={`section ${styles.section}`}
      aria-labelledby="indications-heading"
    >
      <div
        ref={ref}
        className={`container ${styles.headerWrap} reveal ${
          isIntersecting ? 'is-visible' : ''
        }`}
      >
        <h2 id="indications-heading" className={styles.title}>
          {computedTitle}
        </h2>
        <p className={styles.subtitle}>{computedSubtitle}</p>
      </div>

      <div className="container">
        <ul
          ref={listRef}
          className={`${styles.grid} reveal ${listVisible ? 'is-visible' : ''}`}
          aria-label="Список показаний"
        >
          {items.map((text, idx) => (
            <li key={idx} className={styles.item}>
              <span className={styles.icon} aria-hidden="true">
                {checkIcon}
              </span>
              <div className={styles.itemBody}>
                <h3 className={styles.itemTitle}>{text}</h3>
              </div>
              <span className={styles.underline} aria-hidden="true" />
            </li>
          ))}
        </ul>

        <div
          className={`reveal ${listVisible ? 'is-visible' : ''} ${
            styles.ctaRow
          }`}
        >
          {/* <button
            type="button"
            onClick={
              onCtaClick ??
              (() => {
                window.location.hash = 'record';
              })
            }
            className={styles.cta}
          >
            {ctaLabel}
            <span className={styles.arrow} aria-hidden="true">
              {arrowIcon}
            </span>
          </button> */}
          <RecordButton variant="primary">Записаться на приём</RecordButton>
        </div>
      </div>
    </section>
  );
};

const checkIcon = (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="1.5"
      opacity="0.3"
    />
    <path
      d="M7 12.5l3.2 3.2L17 9"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const arrowIcon = (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
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
);

export default Indications;
