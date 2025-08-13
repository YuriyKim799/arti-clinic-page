import React from 'react';
import styles from './Benefits.module.scss';
import { useInView } from '../useInView';

const items = [
  {
    title: 'Персональный план лечения',
    text: 'Каждому пациенту разрабатывается индивидуальный план, адаптированный под его уникальные потребности.',
  },
  {
    title: 'Современные методы и технологии',
    text: 'Мы используем передовые методики и новейшее оборудование, а наш опытный медицинский персонал гарантирует высокое качество лечения.',
  },
  {
    title: 'Комплексный подход каждому пациенту',
    text: 'Мы лечим не только симптомы, но и устраняем причины, обеспечивая долгосрочный результат.',
  },
  {
    title: 'Безоперационное лечение',
    text: 'Мы избавляем вас от боли и дискомфорта без необходимости хирургического вмешательства.',
  },
];

export const Benefits: React.FC = () => {
  const { ref, isIntersecting } = useInView<HTMLDivElement>();
  return (
    <section className={`section ${styles.section}`}>
      <div
        ref={ref}
        className={`container reveal ${isIntersecting ? 'is-visible' : ''}`}
      >
        <h2 className="section-title">Почему выбирают Арти Клиник</h2>
        <div className={styles.grid}>
          {items.map((it, i) => (
            <article
              tabIndex={0}
              key={i}
              className={styles.card}
              aria-label={it.title}
            >
              <div className={styles.face}>
                <h3 className={styles.titleLayer}>{it.title}</h3>
                <p className={styles.textLayer}>{it.text}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};
