import React from 'react';
import { Link } from 'react-router-dom';
import { servicesData } from '../data/services';
import styles from './ServicesIndex.module.scss';
import SeoAuto from '@/components/SeoAuto';

export const ServicesIndex: React.FC = () => {
  const site = import.meta.env.VITE_SITE_URL || 'https://articlinic.ru';

  return (
    <>
      <SeoAuto
        title="Услуги Арти Клиник — лечение болей в спине, кинезиотейпирование, лечебный массаж, рефлексотерапия, фармакопунктура, ударно-волновая терапия, мануальная терапия"
        description="Все услуги клиники: диагностика и лечение межпозвонковых грыж, неврология, рефлексотерапия, ЛФК, мануальная терапия. Москва, ул. 1812 года, д.3., помещ. 5/1"
        images={{
          url: `${site}/og-services/index-1200x630.jpg`, // при желании поставь свой путь
          width: 1200,
          height: 630,
          alt: 'Услуги Arti Clinic',
          type: 'image/jpeg',
        }}
        jsonLd={[
          {
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: 'Услуги Arti Clinic',
            url: `${site}/services`,
            about:
              'Комплексные программы лечения грыжи позвоночника, боли в спине и суставах.',
          },
          {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              {
                '@type': 'ListItem',
                position: 1,
                name: 'Услуги',
                item: `${site}/services`,
              },
            ],
          },
        ]}
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
