import React, { useEffect, useId, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import styles from './NavBar.module.scss';
import LogoIcon from '@/components/LogoIcon/LogoIcon';
import { HashLink } from 'react-router-hash-link';
import RecordModal from './RecordModal';
import RecordButton from './RecordButton/RecordButton';

export const NavBar: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [recordOpen, setRecordOpen] = useState(false);

  const navId = `primary-navigation-${useId()}`; // уникальный id для aria-controls
  const burgerRef = useRef<HTMLButtonElement>(null);
  const firstLinkRef = useRef<HTMLAnchorElement>(null);

  const close = () => setOpen(false);

  // Закрытие по Esc + возврат фокуса на кнопку
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        e.stopPropagation();
        setOpen(false);
        burgerRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey, { passive: true });
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  // Когда меню открылось — переведём фокус на первый пункт (мобайл UX)
  useEffect(() => {
    if (open) firstLinkRef.current?.focus();
  }, [open]);

  return (
    // Было: role="navigation" — лишний landmark. Оставляем просто wrapper.
    <div className={styles.wrapper} aria-label="Шапка сайта">
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
          ref={burgerRef}
          className={styles.burger}
          type="button"
          aria-label={open ? 'Закрыть меню' : 'Открыть меню'}
          aria-expanded={open}
          aria-controls={navId} // ← связь с <nav id={navId}>
          aria-haspopup="true"
          onClick={() => setOpen((v) => !v)}
        >
          <span />
          <span />
          <span />
        </button>

        <nav
          id={navId}
          className={`${styles.nav} ${open ? styles.open : ''}`}
          aria-label="Основное меню"
          // aria-hidden не трогаем, чтобы не ломать десктоп-верстку;
          // состояние можно дублировать для CSS-хуков:
          data-state={open ? 'open' : 'closed'}
        >
          <HashLink smooth to="/#services" onClick={close} ref={firstLinkRef}>
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
          <RecordButton onBeforeOpen={close} variant="primary">
            Записаться
          </RecordButton>
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
