import React from 'react';
import styles from './Footer.module.scss';

export const Footer: React.FC = () => {
  const year = new Date().getFullYear();
  return (
    <footer className={styles.footer}>
      <div className="container">
        <div className={styles.row}>
          <div className={styles.brand}>
            <strong>Арти Клиник</strong>
            <span className="muted">
              Центр вертеброневрологии, рефлексотерапии и мануальной терапии
            </span>
          </div>
          <nav className={styles.nav}>
            <a href="#">Политика конфиденциальности</a>
            <a href="#">Пользовательское соглашение</a>
          </nav>
        </div>
        <div className={styles.copy}>© {year} Арти Клиник</div>
      </div>
    </footer>
  );
};
