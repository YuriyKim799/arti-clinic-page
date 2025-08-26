// src/pages/PriceListPage/PriceListPage.tsx
import React, { useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import styles from './PriceListPage.module.scss';
import PriceListTabsPro from '@/components/PriceList/PriceListTabsPro';
import {
  PRICE_CATEGORIES,
  slugify,
  buildOfferCatalogJsonLd,
} from '@/data/priceList';
import RecordButton from '@/components/RecordButton/RecordButton';

export default function PriceListPage() {
  // Параллакс для героя
  useEffect(() => {
    const ga = document.querySelector(`.${styles.glowA}`) as HTMLElement | null;
    const gb = document.querySelector(`.${styles.glowB}`) as HTMLElement | null;
    const onScroll = () => {
      const y = window.scrollY || 0;
      if (ga) ga.style.transform = `translateY(${(-0.06 * y).toFixed(2)}px)`;
      if (gb) gb.style.transform = `translateY(${(-0.12 * y).toFixed(2)}px)`;
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const offerCatalog = useMemo(buildOfferCatalogJsonLd, []);

  // Плавное появление секций (если нужно)
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>('[data-reveal]');
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add(styles.visible); // класс в module.scss
            io.unobserve(e.target);
          }
        }),
      { threshold: 0.2 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <main className={styles.page}>
      <Helmet>
        <title>Прайс-лист | Арти Клиник</title>
        <meta
          name="description"
          content="Актуальные цены на консультации, мануальную терапию, рефлексотерапию, массаж и лечебные программы в Арти Клиник."
        />
        <link rel="canonical" href="https://articlinic.ru/price-list" />
        <meta property="og:title" content="Прайс-лист | Арти Клиник" />
        <meta
          property="og:description"
          content="Стоимость услуг: консультации, мануальная терапия, рефлексотерапия, массаж, физиотерапия, программы лечения."
        />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">
          {JSON.stringify(offerCatalog)}
        </script>
      </Helmet>

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
            <RecordButton onBeforeOpen={() => close} variant="primary">
              Записаться онлайн
            </RecordButton>
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
  );
}
