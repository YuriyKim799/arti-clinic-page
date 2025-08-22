import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { servicesData } from '../data/services';
import styles from './ServiceDetail.module.scss';
import { NavBar } from '@/components/NavBar';

export const ServiceDetail: React.FC = () => {
  const { slug } = useParams();
  const service = servicesData.find((s) => s.slug === slug);

  useEffect(() => {
    if (!service) return;
    document.title = `${service.title} — Arti Clinic`;
    const metaDesc =
      document.querySelector('meta[name="description"]') ??
      (() => {
        const m = document.createElement('meta');
        m.setAttribute('name', 'description');
        document.head.appendChild(m);
        return m;
      })();
    metaDesc.setAttribute(
      'content',
      service.short || service.full.slice(0, 160)
    );
  }, [service]);

  if (!service) {
    return (
      <main className="section container">
        <h1 className="section-title">Услуга не найдена</h1>
        <p className="muted">Проверьте адрес или вернитесь к списку.</p>
        <p>
          <Link to="/services">← Все услуги</Link>
        </p>
      </main>
    );
  }

  return (
    <main className={`section ${styles.page}`}>
      <NavBar />
      <div className={`container ${styles.wrapper}`}>
        <header className={styles.header}>
          <h1 className={styles.title}>{service.title}</h1>
          {service.short && <p className="muted">{service.short}</p>}
        </header>

        <section className={styles.sectionBlock}>
          <h2>Описание</h2>
          <p>{service.full}</p>
        </section>

        {service.benefits && service.benefits.length > 0 && (
          <section className={styles.sectionBlock}>
            <h2>Преимущества</h2>
            <ul className={styles.list}>
              {service.benefits.map((b: string, i: number) => (
                <li key={i}>{b}</li>
              ))}
            </ul>
          </section>
        )}

        {service.indications && service.indications.length > 0 && (
          <section className={styles.sectionBlock}>
            <h2>Показания</h2>
            <ul className={styles.list}>
              {service.indications.map((b: string, i: number) => (
                <li key={i}>{b}</li>
              ))}
            </ul>
          </section>
        )}

        {service.contraindications && service.contraindications.length > 0 && (
          <section className={styles.sectionBlock}>
            <h2>Противопоказания</h2>
            <ul className={styles.list}>
              {service.contraindications.map((b: string, i: number) => (
                <li key={i}>{b}</li>
              ))}
            </ul>
          </section>
        )}

        {service.faq && service.faq.length > 0 && (
          <section className={styles.sectionBlock}>
            <h2>Частые вопросы</h2>
            <div className={styles.faq}>
              {service.faq.map((f: { q: string; a: string }, i: number) => (
                <details key={i} className={styles.q}>
                  <summary>{f.q}</summary>
                  <p>{f.a}</p>
                </details>
              ))}
            </div>
          </section>
        )}

        <div className={styles.ctaRow}>
          <a href="/#contact" className="btn btn--primary">
            Записаться на приём
          </a>
          <a
            href="https://wa.me/70000000000"
            className="btn btn--outline"
            target="_blank"
            rel="noreferrer"
          >
            WhatsApp
          </a>
          <a
            href="https://t.me/your_clinic"
            className="btn btn--outline"
            target="_blank"
            rel="noreferrer"
          >
            Telegram
          </a>
        </div>
      </div>
    </main>
  );
};
