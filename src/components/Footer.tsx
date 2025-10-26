import React from 'react';
import styles from './Footer.module.scss';
import { Link } from 'react-router-dom';
import LogoIcon from '@/components/LogoIcon/LogoIcon';

export const Footer: React.FC = () => {
  const year = new Date().getFullYear();
  return (
    <footer className={styles.footer}>
      <div className="container">
        <div className={styles.row}>
          <div className={styles.brand}>
            <Link
              to="/"
              className={styles.footerBrand}
              onClick={close}
              aria-label="На главную"
            >
              <LogoIcon alt="Логотип Арти Клиник" />
              <span className={styles.brandText}>Арти Клиник</span>
            </Link>
            <span className="muted">
              Центр вертеброневрологии, рефлексотерапии и мануальной терапии
            </span>
            <Link to="/politic" className={styles.copy}>
              Политика обработки персональных данных
            </Link>
            <span className="muted">+7 (499) 148-17-24</span>
            <span className="muted">+7 (999) 831-06-36</span>
          </div>
        </div>

        <div className={styles.copy}>© {year} Арти Клиник</div>
      </div>
    </footer>
  );
};
