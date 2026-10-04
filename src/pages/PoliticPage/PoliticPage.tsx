import React from 'react';
import styles from './PoliticPage.module.scss';
import PersonalDataPolicy from '@/components/PersonalDataPolicy/PersonalDataPolicy';
import { NavBar } from '@/components/NavBar';
import SeoAuto from '@/components/SeoAuto';
import { CLINIC_SHARE_IMAGE, SITE_ORIGIN } from '@/data/clinic';

export default function PoliticPage() {
  const site = SITE_ORIGIN;

  return (
    <>
      <SeoAuto
        title="Политика в отношении обработки персональных данных — Arti Clinic"
        description="Правовая информация о порядке и принципах обработки и защиты персональных данных в Arti Clinic (ООО «Энергия жизни»)."
        images={CLINIC_SHARE_IMAGE}
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
                item: `${site}/politic`,
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
