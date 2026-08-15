import React from 'react';
import styles from './PainStatement.module.scss';
import { useInView } from '../useInView';

const revealOptions: IntersectionObserverInit = {
  threshold: 0.01,
  rootMargin: '0px 0px 8% 0px',
};

export const PainStatement: React.FC = () => {
  const { ref, isIntersecting } = useInView<HTMLDivElement>(revealOptions);

  return (
    <section
      className={`${styles.section} ${isIntersecting ? styles.sectionVisible : ''}`}
    >
      <div ref={ref} className={styles.wrap}>
        <div className={`${styles.statement} ${isIntersecting ? styles.isVisible : ''}`}>
          <p className={styles.text}>
            <span className={styles.textInner}>
              Если вы устали от постоянной боли и хотите разобраться в её
              причинах, а также получить эффективное лечение - Вам в{' '}
              <em>«Арти Клиник»</em>!
            </span>
          </p>
        </div>
      </div>
    </section>
  );
};
