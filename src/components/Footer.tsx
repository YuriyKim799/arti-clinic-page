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
              © 2025 Клиника вертеброневрологии, рефлексотерапии и мануальной
              терапии. Все права защищены.
            </span>
            <span className="muted">
              ИМЕЮТСЯ ПРОТИВОПОКАЗАНИЯ. НЕОБХОДИМО ПРОКОНСУЛЬТИРОВАТЬСЯ СО
              СПЕЦИАЛИСТОМ.
            </span>
            <span className="muted">
              Лицензия №ЛО41-01137-77/01131635 от 22.04.2024 г. ООО «Энергия
              жизни» ОГРН 1237700555069, ИНН 7730309690.
            </span>
            <span className="muted">
              Юридический адрес: город Москва, вн.тер.г. муниципальный округ
              Дорогомилово, улица 1812 года, дом 3, помещение 5/1.
            </span>

            <span className="muted">+7 (499) 148-17-24</span>
            <span className="muted">+7 (999) 831-06-36</span>
            <Link to="/politic" className={styles.copy}>
              Политика обработки персональных данных.
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
