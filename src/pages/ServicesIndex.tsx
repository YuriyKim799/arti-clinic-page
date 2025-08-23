import React from 'react';
import { Link } from 'react-router-dom';
import { servicesData } from '../data/services';
import styles from './ServicesIndex.module.scss';
import SeoAuto from '@/components/SeoAuto';

export const ServicesIndex: React.FC = () => {
  return (
    <>
      <SeoAuto
        title="Услуги Арти Клиник — лечение болей в спине, кинезиотейпирование, лечебный массаж, рефлексотерапия, фармакопунктура, ударно-волновая терапия, мануальная терапия"
        description="Все услуги клиники: диагностика и лечение межпозвонковых грыж, неврология, рефлексотерапия, ЛФК, мануальная терапия. Москва, ул. 1812 года, д.3., помещ. 5/1"
        image="https://articlinic.ru/og-services.jpg"
      />
      <main className={`section container`}>
        <h1 className="section-title">Услуги Арти Клиник</h1>
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
    </>
  );
};
