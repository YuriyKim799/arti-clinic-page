import React from 'react';
import styles from './Services.module.scss';
import { useInView } from '../useInView';
import { servicesData } from '../data/services';
import { Link } from 'react-router-dom';

export const Services: React.FC = () => {
  const { ref, isIntersecting } = useInView<HTMLDivElement>();
  const list = [...servicesData].sort(
    (a, b) => (b.priority ?? 0) - (a.priority ?? 0)
  );

  return (
    <section id="services" className={`section ${styles.section}`}>
      <div
        ref={ref}
        className={`container reveal ${isIntersecting ? 'is-visible' : ''}`}
      >
        <h2 className="section-title">Услуги</h2>
        <div className={styles.grid}>
          {list.map((s) => (
            <article key={s.slug} className={styles.card}>
              <div className={styles.imageWrap}>
                <img src={s.img} alt={s.title} loading="lazy" />
              </div>
              <div className={styles.cardBody}>
                <h3 className={styles.cardTitle}>
                  <Link to={`/services/${s.slug}`}>{s.title}</Link>
                </h3>
                <p className={styles.cardText}>{s.short}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};
