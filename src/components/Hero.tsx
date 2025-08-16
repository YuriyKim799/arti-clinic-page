import React from 'react';
import styles from './Hero.module.scss';
import { useInView } from '../useInView';
import heroDoctor from '../assets/hero-doctor.png';
import heroVideo from '../assets/hero-bg.mp4';

export const Hero: React.FC = () => {
  const { ref, isIntersecting } = useInView<HTMLDivElement>();

  return (
    <header className={`${styles.hero} section`}>
      <video
        className={styles.bgVideo}
        src={heroVideo}
        autoPlay
        muted
        loop
        playsInline
      />
      <div
        ref={ref}
        className={`container reveal ${isIntersecting ? 'is-visible' : ''}`}
      >
        <div className={styles.wrap}>
          <div className={styles.photoCard} aria-hidden="true">
            <img
              src={heroDoctor}
              alt="Врач проводит консультацию"
              className={styles.photo}
              loading="eager"
            />
          </div>
          <div className={styles.content}>
            <h1 className={styles.title}>
              ЛЕЧИМ БОЛИ
              <br /> В СПИНЕ И МЕЖПОЗВОНКОВЫЕ ГРЫЖИ <br />
              БЕЗ ОПЕРАЦИИ В МОСКВЕ
            </h1>
            <p className={styles.subtitle}>
              Центр вертеброневрологии, рефлексотерапии и мануальной терапии
            </p>
            <div className={styles.ctaRow}>
              <a href="#record" className="btn btn--primary">
                Записаться онлайн
              </a>
              <a
                href="https://wa.me/70000000000"
                target="_blank"
                rel="noreferrer"
                className="btn btn--outline"
                aria-label="Написать в WhatsApp"
              >
                {WhatsAppIcon()} WhatsApp
              </a>
              <a
                href="https://t.me/your_clinic"
                target="_blank"
                rel="noreferrer"
                className="btn btn--outline"
                aria-label="Написать в Telegram"
              >
                {TelegramIcon()} Telegram
              </a>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

const WhatsAppIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M20.52 3.48A11.91 11.91 0 0 0 12.06 0C5.5 0 .2 5.3.2 11.86c0 2.09.55 4.12 1.6 5.93L0 24l6.36-1.67a11.8 11.8 0 0 0 5.71 1.46h.01c6.56 0 11.86-5.3 11.86-11.86 0-3.17-1.23-6.16-3.42-8.45zM12.07 21.4h-.01a9.56 9.56 0 0 1-4.88-1.33l-.35-.2-3.77 1 1.01-3.67-.23-.38a9.55 9.55 0 0 1-1.48-5.07c0-5.27 4.29-9.56 9.57-9.56 2.56 0 4.97 1 6.78 2.82a9.52 9.52 0 0 1 2.8 6.75c0 5.27-4.3 9.56-9.57 9.56zm5.54-7.12c-.3-.15-1.78-.88-2.05-.98-.27-.1-.47-.15-.67.15-.2.3-.77.97-.95 1.18-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.47-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.38-.02-.53-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.5-.17 0-.38-.02-.58-.02-.2 0-.53.08-.8.38-.27.3-1.05 1.03-1.05 2.5 0 1.47 1.08 2.9 1.23 3.1.15.2 2.12 3.23 5.14 4.53.72.31 1.27.5 1.7.64.71.22 1.36.19 1.87.12.57-.08 1.78-.73 2.03-1.45.25-.72.25-1.34.17-1.47-.08-.13-.27-.2-.57-.35z"
      fill="currentColor"
    />
  </svg>
);

const TelegramIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M23.05 2.52c.39-.16.8.2.69.6L19.6 20.88c-.1.44-.6.62-.97.37l-5.38-3.86-2.6 2.52c-.28.27-.73.15-.86-.22L8.3 14.9l-5.64-2.2c-.42-.17-.43-.76-.02-.95L23.05 2.52zM9.27 13.74l1.06 3.14 1.56-1.5 6.58-9.94-9.2 7.43z"
      fill="currentColor"
    />
  </svg>
);
