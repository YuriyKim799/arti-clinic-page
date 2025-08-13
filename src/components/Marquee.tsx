import React from 'react';
import styles from './Marquee.module.scss';

type MarqueeProps = {
  items?: string[];
  speed?: number; // сек за один цикл (меньше — быстрее). по умолчанию 22
  pauseOnHover?: boolean;
};

const DEFAULT = [
  'Врачи с опытом работы от 25 лет',
  'Безопасные и эффективные методы лечения',
  'Снижаем лекарственную нагрузку на пациента',
  'Помогли уже 2000+ пациентам',
  'Используем оборудование экспертного класса',
];

export const Marquee: React.FC<MarqueeProps> = ({
  items = DEFAULT,
  speed = 22,
  pauseOnHover = true,
}) => {
  // дублируем элементы для бесшовной прокрутки
  const loop = [...items, ...items];

  return (
    <div
      className={`${styles.marquee} ${pauseOnHover ? styles.pauseOnHover : ''}`}
      style={{ ['--duration' as any]: `${speed}s` }}
      aria-label="Преимущества клиники"
    >
      <div className={styles.fadeLeft} aria-hidden />
      <div className={styles.fadeRight} aria-hidden />

      <div className={styles.track}>
        {loop.map((t, i) => (
          <span key={i} className={styles.item}>
            {t}
          </span>
        ))}
      </div>
    </div>
  );
};

export default Marquee;
