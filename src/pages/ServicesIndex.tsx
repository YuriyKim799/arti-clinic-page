import React from 'react';
import { Link } from 'react-router-dom';
import { servicesData } from '../data/services';
import styles from './ServicesIndex.module.scss';

export const ServicesIndex: React.FC = () => {
  return (
    <main className={`section container`}>
      <h1 className="section-title">Услуги Arti Clinic</h1>
      <div className={styles.grid}>
        {servicesData.map((s) => (
          <article key={s.slug} className={styles.card}>
            <h2 className={styles.title}>
              <Link to={`/services/${s.slug}`}>{s.title}</Link>
            </h2>
            <p className={styles.excerpt}>{s.short}</p>
            <Link to={`/services/${s.slug}`} className={styles.more}>
              Подробнее →
            </Link>
          </article>
        ))}
      </div>
    </main>
  );
};
