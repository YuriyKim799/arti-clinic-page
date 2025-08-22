import React, { useEffect } from 'react';
import styles from './AgreementPage.module.scss';
import ConsentAgreement from '@/components/ConsentAgreement/ConsentAgreement';
import { NavBar } from '@/components/NavBar';

export default function AgreementPage() {
  useEffect(() => {
    document.title = 'Согласие на обработку персональных данных — Arti Clinic';
  }, []);

  return (
    <main className={styles.page}>
      <NavBar />
      <div className={styles.wrap}>
        <h1 className={styles.title}>
          Согласие на обработку персональных данных
        </h1>
        <ConsentAgreement />
      </div>
    </main>
  );
}
