import React from 'react';
import styles from './PainStatement.module.scss';
import { useInView } from '../useInView';
import doctorPhoto from '@/assets/hero-doctor2.jpg';

const doctorAvif = import.meta.glob('/src/assets/hero-doctor2-*.avif', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;
const doctorWebp = import.meta.glob('/src/assets/hero-doctor2-*.webp', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

function toSrcSet(entries: Record<string, string>) {
  return Object.entries(entries)
    .map(([file, url]) => {
      const match = file.match(/-(\d+)\.(avif|webp)$/i);
      return match ? { width: Number(match[1]), url } : null;
    })
    .filter((entry): entry is { width: number; url: string } => entry !== null)
    .sort((a, b) => a.width - b.width)
    .map(({ width, url }) => `${url} ${width}w`)
    .join(', ');
}

const doctorAvifSrcSet = toSrcSet(doctorAvif);
const doctorWebpSrcSet = toSrcSet(doctorWebp);
const doctorSizes = '(max-width: 392px) calc(100vw - 32px), (max-width: 720px) 360px, (max-width: 1100px) 38vw, 420px';

const revealOptions: IntersectionObserverInit = {
  threshold: 0.01,
  rootMargin: '0px 0px 8% 0px',
};

export const PainStatement: React.FC = () => {
  const { ref, isIntersecting } = useInView<HTMLDivElement>(revealOptions);

  return (
    <section
      className={`${styles.section} ${isIntersecting ? styles.sectionVisible : ''}`}
    >
      <div ref={ref} className={styles.wrap}>
        <picture className={styles.photoCard}>
          <source type="image/avif" srcSet={doctorAvifSrcSet} sizes={doctorSizes} />
          <source type="image/webp" srcSet={doctorWebpSrcSet} sizes={doctorSizes} />
          <img
            className={styles.doctorPhoto}
            src={doctorPhoto}
            alt="Тян Виктория Николаевна — врач Арти Клиник"
            width={1200}
            height={1600}
            loading="lazy"
            decoding="async"
          />
        </picture>
        <div className={`${styles.statement} ${isIntersecting ? styles.isVisible : ''}`}>
          <p className={styles.text}>
            <span className={styles.textInner}>
              Если Вы устали от постоянной боли и хотите разобраться в её
              причинах, а также получить эффективное лечение - Вам в{' '}
              <em>«Арти Клиник»</em>!
            </span>
          </p>
        </div>
      </div>
    </section>
  );
};
