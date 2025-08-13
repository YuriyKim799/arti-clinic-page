import React from 'react';
import styles from './Reviews.module.scss';
import { useInView } from '../useInView';

const reviews = [
  {
    name: 'Марина',
    text: 'После курса иглотерапии боль в спине ушла, стала лучше спать. Спасибо врачам Arti Clinic!',
  },
  {
    name: 'Алексей',
    text: 'Грамотная диагностика и понятный план лечения. Уже через неделю почувствовал облегчение.',
  },
  {
    name: 'Екатерина',
    text: 'Комфортная клиника, внимательный персонал. Запись без очередей, всё чётко по времени.',
  },
];

export const Reviews: React.FC = () => {
  const { ref, isIntersecting } = useInView<HTMLDivElement>();

  return (
    <section id="reviews" className={`section ${styles.section}`}>
      <div
        ref={ref}
        className={`container reveal ${isIntersecting ? 'is-visible' : ''}`}
      >
        <h2 className="section-title">Отзывы пациентов</h2>
        <div className={styles.grid}>
          {reviews.map((r, i) => (
            <figure key={i} className={styles.item}>
              <blockquote className={styles.text}>“{r.text}”</blockquote>
              <figcaption className={styles.author}>— {r.name}</figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
};
