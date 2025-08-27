// src/pages/PriceListPage/PriceListPage.tsx
import React, { useEffect, useMemo } from 'react';
import styles from './PriceListPage.module.scss';
import PriceListTabsPro from '@/components/PriceList/PriceListTabsPro';
import {
  PRICE_CATEGORIES,
  slugify,
  buildOfferCatalogJsonLd,
} from '@/data/priceList';
import RecordButton from '@/components/RecordButton/RecordButton';
import SeoAuto from '@/components/SeoAuto';

export default function PriceListPage() {
  const offerCatalog = useMemo(buildOfferCatalogJsonLd, []);

  // Плавное появление секций (если нужно)
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>('[data-reveal]');
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const el = e.target as HTMLElement;
            el.classList.add(styles.visible); // как было
            el.setAttribute('data-reveal', 'shown'); // фолбэк
            io.unobserve(el);
          }
        }),
      { threshold: 0.2 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  const site = import.meta.env.VITE_SITE_URL || 'https://articlinic.ru';

  return (
    <>
      <SeoAuto
        title="Прайс-лист — Arti Clinic"
        description="Актуальные цены на консультации, мануальную терапию, рефлексотерапию, массаж, физиотерапию и комплексные лечебные программы."
        images={{
          url: `${site}/og/price-1200x630.jpg`,
          width: 1200,
          height: 630,
          alt: 'Прайс-лист Arti Clinic',
          type: 'image/jpeg',
        }}
        jsonLd={[
          offerCatalog, // твой OfferCatalog
          {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              {
                '@type': 'ListItem',
                position: 1,
                name: 'Главная',
                item: `${site}/`,
              },
              {
                '@type': 'ListItem',
                position: 2,
                name: 'Прайс-лист',
                item: `${site}/price-list`,
              },
            ],
          },
        ]}
      />

      <main className={styles.page}>
        {/* HERO */}
        <section className={styles.hero}>
          <div className={styles.heroInner}>
            <nav className={styles.breadcrumbs} aria-label="Хлебные крошки">
              <a href="/" className={styles.crumb}>
                Главная
              </a>
              <span className={styles.sep}>/</span>
              <span aria-current="page" className={styles.crumbCurrent}>
                Прайс-лист
              </span>
            </nav>
            <h1 className={styles.h1} data-reveal>
              Прайс-лист
            </h1>
            <p className={styles.lead} data-reveal>
              Честная и прозрачная стоимость
            </p>
          </div>
          <div className={styles.aurora} aria-hidden />
          <div className={styles.glowA} aria-hidden />
          <div className={styles.glowB} aria-hidden />
        </section>

        {/* Content: прайс + липкое оглавление */}
        <section className={styles.section} data-reveal>
          <div className={styles.layout}>
            <div className={styles.card}>
              <header className={styles.cardHead}>
                <h2 className={styles.cardTitle}>Стоимость услуг</h2>
                <p className={styles.cardNote}>
                  Обновлено: <time>25.08.2025</time>
                </p>
              </header>

              <PriceListTabsPro hideInternalToc scrollOffset={90} />

              <footer className={styles.cardFoot}>
                <p className={styles.notice}>
                  * Цены указаны в рублях. Окончательная стоимость зависит от
                  индивидуального плана лечения.
                </p>
              </footer>
            </div>

            <aside className={styles.aside} aria-label="Навигация по разделам">
              <div className={styles.asideCard}>
                <h3 className={styles.asideTitle}>Разделы</h3>
                <ul className={styles.asideList}>
                  {PRICE_CATEGORIES.map((c) => (
                    <li key={c.title}>
                      <a href={`#${slugify(c.title)}`}>{c.title}</a>
                    </li>
                  ))}
                </ul>
              </div>
              <RecordButton variant="primary">Записаться онлайн</RecordButton>
            </aside>
          </div>
        </section>

        {/* CTA */}
        <section className={styles.cta} data-reveal>
          <div className={styles.ctaCard}>
            <div className={styles.ctaText}>
              <h3 className={styles.ctaTitle}>Нужна помощь с выбором?</h3>
              <p className={styles.ctaLead}>
                Опишите ваши симптомы — подскажем оптимальную программу и
                рассчитаем курс.
              </p>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
