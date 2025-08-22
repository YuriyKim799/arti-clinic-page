import React, { useEffect } from 'react';
import styles from './PoliticPage.module.scss';
import PersonalDataPolicy from '@/components/PersonalDataPolicy/PersonalDataPolicy';
import { NavBar } from '@/components/NavBar';

export default function PoliticPage() {
  useEffect(() => {
    document.title =
      'Политика в отношении обработки персональных данных — Arti Clinic';
  }, []);

  return (
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
  );
}
