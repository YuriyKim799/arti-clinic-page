import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import styles from './NavBar.module.scss';
import LogoIcon from '@/components/LogoIcon/LogoIcon';
import { HashLink } from 'react-router-hash-link';
import RecordModal from './RecordModal';
import RecordButton from './RecordButton/RecordButton';

export const NavBar: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [recordOpen, setRecordOpen] = useState(false);

  const close = () => setOpen(false);

  return (
    <div
      className={styles.wrapper}
      role="navigation"
      aria-label="Главная навигация"
    >
      <div className={`container ${styles.bar}`}>
        <Link
          to="/"
          className={styles.brand}
          onClick={close}
          aria-label="На главную"
        >
          <LogoIcon alt="Логотип Арти Клиник" />
          <span className={styles.brandText}>Арти Клиник</span>
        </Link>

        <button
          className={styles.burger}
          aria-label="Открыть меню"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <span />
          <span />
          <span />
        </button>
        <nav className={`${styles.nav} ${open ? styles.open : ''}`}>
          <HashLink smooth to="/#services" onClick={close}>
            Услуги
          </HashLink>
          <HashLink smooth to="/#reviews" onClick={close}>
            Отзывы
          </HashLink>
          <HashLink smooth to="/price-list" onClick={close}>
            Цены
          </HashLink>
          <HashLink smooth to="/#blog" onClick={close}>
            Блог
          </HashLink>
          <HashLink smooth to="/#contact" onClick={close}>
            Контакты
          </HashLink>
          <RecordButton onBeforeOpen={close} variant='primary'>Записаться</RecordButton>
        </nav>
        {recordOpen && (
          <RecordModal
            isOpen={recordOpen}
            onClose={() => setRecordOpen(false)}
          />
        )}
      </div>
    </div>
  );
};
