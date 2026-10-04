import React from 'react';
import { Link } from 'react-router-dom';
import { servicesData } from '../data/services';
import styles from './ServicesIndex.module.scss';
import SeoAuto from '@/components/SeoAuto';
import { CLINIC_SHARE_IMAGE, SITE_ORIGIN } from '@/data/clinic';

export const ServicesIndex: React.FC = () => {
  const site = SITE_ORIGIN;

  return (
    <>
      <SeoAuto
        title="Услуги и программы лечения в Москве — Арти Клиник"
        description="Все услуги клиники: диагностика и лечение межпозвонковых грыж, неврология, рефлексотерапия, ЛФК, мануальная терапия. Москва, ул. 1812 года, д.3., помещ. 5/1"
        images={CLINIC_SHARE_IMAGE}
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
                name: 'Главная',
                item: `${site}/`,
              },
              {
                '@type': 'ListItem',
                position: 2,
                name: 'Услуги',
                item: `${site}/services`,
              },
            ],
          },
        ]}
      />
      <main className={`section container`}>
        <nav aria-label="Хлебные крошки">
          <Link to="/">Главная</Link> / <span aria-current="page">Услуги</span>
        </nav>
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
        <p><Link to="/price-list">Цены на консультации и лечение</Link></p>
      </main>
    </>
  );
};
