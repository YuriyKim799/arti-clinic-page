import React from 'react';
import styles from './Hero.module.scss';
import { useInView } from '../useInView';
import heroDoctor from '../assets/hero-doctor.png';
import heroVideo from '../assets/hero-bg.mp4';
import WhatsAppButton from '@/components/WhatsAppButton/WhatsAppButton';
import TelegramButton from '@/components/TelegramButton/TelegramButton';

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
              <WhatsAppButton phone="+79998310636" variant="primary" />
              <TelegramButton to="@Artiklinic" variant="primary" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

