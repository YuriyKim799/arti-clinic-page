import { Link } from 'react-router-dom';
import type { ServiceItem } from '@/data/services';
import { updateWaveOrigin } from '@/utils/updateWaveOrigin';
import styles from './Services.module.scss';

type ServiceCardsProps = {
  items: readonly ServiceItem[];
  headingLevel?: 2 | 3;
};

export default function ServiceCards({ items, headingLevel = 3 }: ServiceCardsProps) {
  const Heading = headingLevel === 2 ? 'h2' : 'h3';

  return (
    <div className={styles.grid}>
      {items.map((service) => (
        <Link
          key={service.slug}
          to={`/services/${service.slug}`}
          className={`${styles.card} ${styles.clickHintCard}`}
          aria-label={service.title}
          onPointerMove={updateWaveOrigin}
          onPointerEnter={updateWaveOrigin}
        >
          <div className={styles.imageWrap}>
            <img src={service.img} alt={service.title} loading="lazy" decoding="async"
              className={service.slug === 'nevrolog' ? styles.portraitImage : undefined} />
          </div>
          <div className={styles.cardBody}>
            <Heading className={styles.cardTitle}>{service.title}</Heading>
            <p className={styles.cardText}>{service.short}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}
