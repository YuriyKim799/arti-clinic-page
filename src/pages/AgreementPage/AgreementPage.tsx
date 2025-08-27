import React from 'react';
import styles from './AgreementPage.module.scss';
import ConsentAgreement from '@/components/ConsentAgreement/ConsentAgreement';
import { NavBar } from '@/components/NavBar';
import SeoAuto from '@/components/SeoAuto';

export default function AgreementPage() {
  const site = import.meta.env.VITE_SITE_URL || 'https://articlinic.ru';

  return (
    <>
      <SeoAuto
        title="Согласие на обработку персональных данных — Arti Clinic"
        description="Форма согласия на обработку персональных данных для пациентов Arti Clinic."
        images={{
          url: `${site}/og/agreement-1200x630.jpg`,
          width: 1200,
          height: 630,
          alt: 'Согласие на обработку персональных данных',
          type: 'image/jpeg',
        }}
        jsonLd={[
          {
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: 'Согласие на обработку персональных данных',
            description:
              'Условия и форма согласия на обработку персональных данных в Arti Clinic.',
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
                name: 'Согласие на обработку персональных данных',
                item: `${site}/agreement`,
              },
            ],
          },
        ]}
      />

      <main className={styles.page}>
        <NavBar />
        <div className={styles.wrap}>
          <h1 className={styles.title}>
            Согласие на обработку персональных данных
          </h1>
          <ConsentAgreement />
        </div>
      </main>
    </>
  );
}
