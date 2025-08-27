import React from 'react';
import styles from './PoliticPage.module.scss';
import PersonalDataPolicy from '@/components/PersonalDataPolicy/PersonalDataPolicy';
import { NavBar } from '@/components/NavBar';
import SeoAuto from '@/components/SeoAuto';

export default function PoliticPage() {
  const site = import.meta.env.VITE_SITE_URL || 'https://articlinic.ru';

  return (
    <>
      <SeoAuto
        title="Политика в отношении обработки персональных данных — Arti Clinic"
        description="Правовая информация о порядке и принципах обработки и защиты персональных данных в Arti Clinic (ООО «Энергия жизни»)."
        images={{
          url: `${site}/og/policy-1200x630.jpg`,
          width: 1200,
          height: 630,
          alt: 'Политика обработки персональных данных',
          type: 'image/jpeg',
        }}
        jsonLd={[
          {
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: 'Политика обработки персональных данных',
            description:
              'Политика ООО «Энергия жизни» (Оператор) в отношении обработки персональных данных.',
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
                name: 'Политика обработки персональных данных',
                item: `${site}/policy`,
              },
            ],
          },
        ]}
      />

      <main className={styles.page}>
        <NavBar />
        <div className={styles.wrap}>
          <h1 className={styles.title}>
            Политика ООО «Энергия жизни» (Оператора) в отношении обработки
            персональных данных
          </h1>
          <PersonalDataPolicy />
        </div>
      </main>
    </>
  );
}
