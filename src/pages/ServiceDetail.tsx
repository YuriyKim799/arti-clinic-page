import React, { useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { servicesData } from '@/data/services';
import styles from './ServiceDetail.module.scss';
import { NavBar } from '@/components/NavBar';
import WhatsAppButton from '@/components/WhatsAppButton/WhatsAppButton';
import TelegramButton from '@/components/TelegramButton/TelegramButton';
import { Footer } from '@/components/Footer';
import SeoAuto from '@/components/SeoAuto';

type Params = { slug?: string };

export const ServiceDetail: React.FC = () => {
  const { slug } = useParams();
  const service = servicesData.find((s) => s.slug === slug);

  // пригодится для JSON-LD url
  const { pathname } = useLocation();
  const site = import.meta.env.VITE_SITE_URL || 'https://articlinic.ru';
  const url = new URL(pathname || '/', site).toString();

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
      <>
        <SeoAuto
          title="Услуга не найдена — Arti Clinic"
          description="К сожалению, такой страницы нет. Проверьте адрес или вернитесь к списку услуг."
          robots="noindex, nofollow"
        />
        <main className="section container">
          <h1 className="section-title">Услуга не найдена</h1>
          <p className="muted">Проверьте адрес или вернитесь к списку.</p>
          <p>
            <Link to="/services">← Все услуги</Link>
          </p>
        </main>
      </>
    );
  }

  const title = `${service.title} — Arti Clinic, Москва`;
  const description =
    service.short ??
    (service.full || '').replace(/\s+/g, ' ').trim().slice(0, 160);

  // если нет своей OG-картинки — используем дефолт/по слагу
  const image =
    (service as any).ogImage || `${site}/og-services/${service.slug}.jpg`; // если файла нет — просто отдадим 404 для картинки, это нормально

  // JSON-LD: что это за услуга
  const serviceJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: service.title,
    description,
    provider: { '@type': 'MedicalClinic', name: 'Arti Clinic' },
    areaServed: 'Москва',
    url,
  };

  // JSON-LD: хлебные крошки
  const breadcrumbsJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Услуги',
        item: `${site}/services`,
      },
      { '@type': 'ListItem', position: 2, name: service.title, item: url },
    ],
  };

  return (
    <>
      <SeoAuto
        title={title}
        description={description}
        image={image}
        jsonLd={[serviceJsonLd, breadcrumbsJsonLd]}
        ogType="website"
      />
      <NavBar />
      <main className={`section ${styles.page}`}>
        <div className={`container ${styles.wrapper}`}>
          <Link to="/" className={styles.backLink}>
            ← Главная
          </Link>
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

          {service.contraindications &&
            service.contraindications.length > 0 && (
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
            <WhatsAppButton phone="+79998310636" variant="primary" />
            <TelegramButton to="@Artiklinic" variant="primary" />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
};
