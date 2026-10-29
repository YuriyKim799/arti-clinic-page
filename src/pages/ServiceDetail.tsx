import React, { lazy, Suspense } from 'react';
import { useParams, Link } from 'react-router-dom';
import { servicesData } from '@/data/services';
import styles from './ServiceDetail.module.scss';
import { NavBar } from '@/components/NavBar';
import WhatsAppButton from '@/components/WhatsAppButton/WhatsAppButton';
import TelegramButton from '@/components/TelegramButton/TelegramButton';
import { Footer } from '@/components/Footer';
import SeoAuto from '@/components/SeoAuto';
import RecordButton from '@/components/RecordButton/RecordButton';
import { CLINIC_ID, CLINIC_SHARE_IMAGE, SITE_ORIGIN, clinicJsonLd } from '@/data/clinic';
import { doctorProfiles } from '@/data/doctorProfiles';
import { doctors } from '@/data/doctors';
import { neurologistConsultationPrices, primaryConsultationMinimum, rubleAmount } from '@/data/neurologistConsultation';
import { relatedArticlesForService } from '@/data/seoTopics';

const NeurologistConsultation = lazy(() => import('@/components/NeurologistConsultation'));

type Params = { slug?: string };

function renderBold(line: string) {
  const parts = line.split('**'); // "до **жирный** после"
  return parts.map((part, i) =>
    i % 2 === 1 ? <strong key={i}>{part}</strong> : part
  );
}

function formatText(text: string) {
  // делим по абзацам
  const paragraphs = text.split('\n\n');

  return paragraphs.map((p, pIndex) => (
    <p key={pIndex}>
      {p.split('\n').map((line, lIndex, arr) => (
        <React.Fragment key={lIndex}>
          {renderBold(line)}
          {lIndex < arr.length - 1 && <br />}
        </React.Fragment>
      ))}
    </p>
  ));
}

// Match the visible answer renderer: ** marks emphasis, paragraphs/br add space.
function plainAnswer(text: string): string {
  return text.replace(/\*\*/g, '').replace(/\s+/g, ' ').trim();
}

export const ServiceDetail: React.FC = () => {
  const { slug } = useParams<Params>();
  const service = servicesData.find((s) => s.slug === slug);

  const site = SITE_ORIGIN;

  if (!service) {
    return (
      <>
        <SeoAuto
          title="Услуга не найдена — Arti Clinic"
          description="К сожалению, такой страницы нет. Проверьте адрес или вернитесь к списку услуг."
          robots="noindex, nofollow"
          images={CLINIC_SHARE_IMAGE}
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

  const url = `${site}/services/${service.slug}`;
  const isNeurologistConsultation = service.slug === 'nevrolog';
  const relatedArticles = isNeurologistConsultation ? [] : relatedArticlesForService(service.slug);
  const title = service.seoTitle || `${service.title.replace(/^Программа «(.+)»\.?$/, '$1')} в Москве — Арти Клиник`;
  const description =
    service.seoDescription ?? service.short ??
    (service.full || '').replace(/\s+/g, ' ').trim().slice(0, 160);

  const ogUrl = new URL(service.img, site).toString();
  const offers = isNeurologistConsultation ? neurologistConsultationPrices.flatMap((item) => {
    const price = rubleAmount(item.price);
    return price === null ? [] : [{
      '@type': 'Offer',
      name: item.title,
      price,
      priceCurrency: 'RUB',
      url: `${url}#consultation-prices`,
    }];
  }) : undefined;

  const serviceJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    '@id': `${url}#service`,
    name: service.title,
    description,
    provider: {
      '@type': 'MedicalClinic',
      '@id': CLINIC_ID,
      name: 'Арти Клиник',
      url: `${site}/`,
    },
    areaServed: 'Москва',
    url,
    mainEntityOfPage: { '@id': `${url}#webpage` },
    offers,
  };

  const faqJsonLd = service.faq?.length ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': `${url}#service-faq`,
    isPartOf: { '@id': `${url}#webpage` },
    mainEntity: service.faq.map((item, index) => ({
      '@type': 'Question',
      '@id': `${url}#service-question-${index + 1}`,
      name: item.q.replace(/\s+/g, ' ').trim(),
      acceptedAnswer: { '@type': 'Answer', text: plainAnswer(item.a) },
    })),
  } : undefined;

  const pageJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'MedicalWebPage',
    '@id': `${url}#webpage`,
    url, name: title, description, inLanguage: 'ru-RU',
    about: { '@id': `${url}#service` },
    mainEntity: { '@id': `${url}#service` },
    publisher: { '@id': CLINIC_ID },
    breadcrumb: { '@id': `${url}#breadcrumbs` },
    ...(faqJsonLd ? { hasPart: { '@id': faqJsonLd['@id'] } } : {}),
    ...(relatedArticles.length ? { relatedLink: relatedArticles.map(article => new URL(article.href, site).href) } : {}),
  };

  const breadcrumbsJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    '@id': `${url}#breadcrumbs`,
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
        name: 'Услуги',
        item: `${site}/services`,
      },
      { '@type': 'ListItem', position: 3, name: service.title, item: url },
    ],
  };

  return (
    <>
      <SeoAuto
        title={title}
        description={description}
        canonical={url}
        images={isNeurologistConsultation ? CLINIC_SHARE_IMAGE : {
          url: ogUrl,
          alt: service.title,
          type: 'image/webp',
        }}
        jsonLd={[pageJsonLd, serviceJsonLd, clinicJsonLd, breadcrumbsJsonLd, ...(faqJsonLd ? [faqJsonLd] : [])]}
        ogType="website"
      />

      <NavBar />
      <main className={`section ${styles.page}`}>
        <div className={`container ${styles.wrapper}`}>
          <nav className={styles.breadcrumbs} aria-label="Хлебные крошки">
            <Link to="/">Главная</Link>
            <span aria-hidden="true">/</span>
            <Link to="/services">Услуги</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">{service.title}</span>
          </nav>
          <header className={styles.header}>
            <h1 className={styles.title}>{service.title}</h1>
            {service.short && <p className="muted">{service.short}</p>}
            {isNeurologistConsultation && (
              <div className={styles.consultationIntro}>
                {primaryConsultationMinimum !== undefined && (
                  <a href="#consultation-prices">Первичный приём от {primaryConsultationMinimum.toLocaleString('ru-RU')} ₽</a>
                )}
                <RecordButton variant="primary">Записаться к неврологу</RecordButton>
              </div>
            )}
          </header>

          <section className={styles.sectionBlock}>
            <h2>{isNeurologistConsultation ? 'Как проходит приём невролога' : 'Описание'}</h2>
            <div style={{ whiteSpace: 'pre-line' }}>
              {formatText(service.full)}
            </div>
            {service.fullImage?.src && (
              <img
                className={styles.fullImage}
                src={service.fullImage.src}
                alt={service.fullImage.alt}
                loading="lazy"
                decoding="async"
              />
            )}
          </section>

          {isNeurologistConsultation && (
            <Suspense fallback={null}><NeurologistConsultation /></Suspense>
          )}

          {(service.symptoms?.trim() || service.symptomsImage?.src) && (
            <section className={styles.sectionBlock}>
              <h2>Симптомы</h2>
              {service.symptoms?.trim() && (
                <div style={{ whiteSpace: 'pre-line' }}>
                  {formatText(service.symptoms)}
                </div>
              )}
              {service.symptomsImage?.src && (
                <img
                  className={styles.fullImage}
                  src={service.symptomsImage.src}
                  alt={service.symptomsImage.alt}
                  loading="lazy"
                  decoding="async"
                />
              )}
            </section>
          )}

          {service.results && service.results.length > 0 && (
            <section className={styles.sectionBlock}>
              <h2>Какие результаты обычно отмечают пациенты ?</h2>
              {service.resultsIntro && formatText(service.resultsIntro)}
              <div className={styles.faq}>
                {service.results.map((result, i) => (
                  <details key={`${service.slug}-${i}`} className={styles.q}>
                    <summary>{renderBold(result.q)}</summary>
                    <div>{formatText(result.a)}</div>
                  </details>
                ))}
              </div>
              {service.resultsNote && formatText(service.resultsNote)}
            </section>
          )}

          {service.nonSurgicalTreatment?.trim() && (
            <section className={styles.sectionBlock}>
              <h2>Когда врач назначает консервативное (безоперационное) лечение? </h2>
              <div style={{ whiteSpace: 'pre-line' }}>
                {formatText(service.nonSurgicalTreatment)}
              </div>
            </section>
          )}

          {service.benefits && service.benefits.length > 0 && (
            <section className={styles.sectionBlock}>
              <h2>Преимущества услуги в «Арти Клиник»</h2>
              <ul className={styles.list}>
                {service.benefits.map((b: string, i: number) => (
                  <li key={i}>{formatText(b)}</li>
                ))}
              </ul>
            </section>
          )}

          {service.indications && service.indications.length > 0 && (
            <section className={styles.sectionBlock}>
              <h2>Показания</h2>
              <ul className={styles.list}>
                {service.indications.map((b: string, i: number) => (
                  <li key={i}>{formatText(b)}</li>
                ))}
              </ul>
            </section>
          )}

          {service.contraindications &&
            service.contraindications.length > 0 && (
              <section className={styles.sectionBlock}>
                <h2>Имеются противопоказания. Необходима консультация специалиста.  </h2>
                <ul className={styles.list}>
                  {service.contraindications.map((b: string, i: number) => (
                    <li key={i}>{formatText(b)}</li>
                  ))}
                </ul>
              </section>
            )}

          {service.faq && service.faq.length > 0 && (
            <section id="service-faq" className={styles.sectionBlock}>
              <h2>Частые вопросы</h2>
              <div className={styles.faq}>
                {service.faq.map((f: { q: string; a: string }, i: number) => (
                  <details key={i} id={`service-question-${i + 1}`} className={styles.q}>
                    <summary>{f.q}</summary>
                    <div>{formatText(f.a)}</div>
                  </details>
                ))}
              </div>
            </section>
          )}

          {relatedArticles.length > 0 && (
            <section className={styles.sectionBlock} aria-labelledby="service-reading-title">
              <h2 id="service-reading-title">Материалы по теме</h2>
              <ul className={styles.readingList}>
                {relatedArticles.map(article => <li key={article.href}><Link to={article.href}>{article.label}</Link></li>)}
              </ul>
            </section>
          )}

          <div className={styles.ctaRow}>
            <RecordButton variant="primary">Записаться онлайн</RecordButton>
            <WhatsAppButton phone="+79998310636" variant="primary" />
            <TelegramButton to="@Artiklinic" variant="primary" />
          </div>
          <nav className={styles.relatedLinks} aria-label="Дополнительная информация">
            <Link to="/price-list">Стоимость консультаций и лечения</Link>
            <Link to="/services">Все услуги клиники</Link>
            <Link to="/doctors">Специалисты Арти Клиник</Link>
          </nav>
          {!isNeurologistConsultation && doctorProfiles.some(profile => profile.serviceSlugs.includes(service.slug)) && (
            <section className={styles.sectionBlock} aria-labelledby="service-doctors-title">
              <h2 id="service-doctors-title">Врачи направления</h2>
              <ul className={styles.list}>
                {doctorProfiles.filter(profile => profile.serviceSlugs.includes(service.slug)).map(profile => {
                  const doctor = doctors.find(({ id }) => id === profile.slug);
                  return doctor ? <li key={profile.slug}><Link to={`/doctors/${profile.slug}`}>{doctor.name} — профиль и документы</Link></li> : null;
                })}
              </ul>
            </section>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
};
