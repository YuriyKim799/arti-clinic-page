import React, { useState } from 'react';
import styles from './NavBar.module.scss';

export const NavBar: React.FC = () => {
  const [open, setOpen] = useState(false);

  const close = () => setOpen(false);

  return (
    <div
      className={styles.wrapper}
      role="navigation"
      aria-label="Главная навигация"
    >
      <div className={`container ${styles.bar}`}>
        <a
          href="#"
          className={styles.brand}
          onClick={close}
          aria-label="На главную"
        >
          <span className={styles.logoDot} aria-hidden="true" />
          <span className={styles.brandText}>Арти Клиник</span>
        </a>

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
          <a href="#services" onClick={close}>
            Услуги
          </a>
          <a href="#reviews" onClick={close}>
            Отзывы
          </a>
          <a href="#blog" onClick={close}>
            Блог
          </a>
          <a href="#contact" onClick={close}>
            Контакты
          </a>
          <a href="#record" className={styles.cta} onClick={close}>
            Записаться
          </a>
        </nav>
      </div>
    </div>
  );
};
