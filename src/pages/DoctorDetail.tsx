import { Link, useParams } from 'react-router-dom';
import { HashLink } from 'react-router-hash-link';
import SeoAuto from '@/components/SeoAuto';
import { NavBar } from '@/components/NavBar';
import { Footer } from '@/components/Footer';
import RecordButton from '@/components/RecordButton/RecordButton';
import { CLINIC_ID, CLINIC_SCHEDULE_TEXT, SITE_ORIGIN, clinicJsonLd } from '@/data/clinic';
import { doctorConsultationMinimum, doctorConsultationPrices, getDoctorProfile } from '@/data/doctorProfiles';
import { consultationLabel } from '@/data/neurologistConsultation';
import NotFound from './NotFound';
import styles from './DoctorPages.module.scss';

export default function DoctorDetail() {
  const { slug } = useParams();
  const profile = getDoctorProfile(slug);
  if (!profile) return <NotFound />;

  const { doctor } = profile;
  const url = `${SITE_ORIGIN}/doctors/${profile.slug}`;
  const personId = `${url}#person`;
  const prices = doctorConsultationPrices(profile);
  const priceFrom = doctorConsultationMinimum(profile);

  return (
    <>
      <SeoAuto
        title={`${doctor.name} — ${doctor.position?.toLowerCase() || 'врач'} Арти Клиник, Москва`}
        description={profile.description}
        images={{ url: doctor.photo.src, width: 1829, height: 2560, alt: doctor.name, type: 'image/jpeg' }}
        jsonLd={[
          {
            '@context': 'https://schema.org', '@type': 'Person', '@id': personId,
            name: doctor.name, url, image: new URL(doctor.photo.src, SITE_ORIGIN).href,
            jobTitle: doctor.position || 'Врач-невролог', description: profile.introduction,
            worksFor: { '@id': CLINIC_ID }, knowsAbout: profile.interests,
            ...(profile.identitySources?.length ? { sameAs: profile.identitySources } : {}),
            ...(profile.qualifications.some(item => item.label === 'Учёная степень') ? {
              hasCredential: {
                '@type': 'EducationalOccupationalCredential', credentialCategory: 'Учёная степень',
                name: profile.qualifications.find(item => item.label === 'Учёная степень')!.value,
              },
            } : {}),
          },
          clinicJsonLd,
          { '@context': 'https://schema.org', '@type': 'ProfilePage', '@id': `${url}#page`, url, name: doctor.name, mainEntity: { '@id': personId } },
          {
            '@context': 'https://schema.org', '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Главная', item: `${SITE_ORIGIN}/` },
              { '@type': 'ListItem', position: 2, name: 'Врачи', item: `${SITE_ORIGIN}/doctors` },
              { '@type': 'ListItem', position: 3, name: doctor.name, item: url },
            ],
          },
        ]}
      />
      <NavBar />
      <main className={`container ${styles.main}`}>
        <nav className={styles.breadcrumbs} aria-label="Хлебные крошки">
          <Link to="/">Главная</Link><span aria-hidden="true">/</span>
          <Link to="/doctors">Врачи</Link><span aria-hidden="true">/</span>
          <span aria-current="page">{doctor.name}</span>
        </nav>

        <header className={styles.hero}>
          <div className={styles.heroContent}>
            <p className={styles.eyebrow}>{doctor.position} · Арти Клиник</p>
            <h1>{doctor.name}</h1>
            <ul className={styles.specialties} aria-label="Направления работы">
              {profile.specialties.map(specialty => <li key={specialty}>{specialty}</li>)}
            </ul>
            <p className={styles.lead}>{profile.introduction}</p>
            {priceFrom !== undefined && <p className={styles.startingPrice}>Приём от <strong>{priceFrom.toLocaleString('ru-RU')} ₽</strong></p>}
            <div className={styles.actions}>
              <div className={styles.appointmentButtons}>
                <RecordButton variant="primary">Записаться на приём</RecordButton>
                {profile.slug === 'kim-alina' && (
                  <div className={styles.offerAction}>
                    <RecordButton variant="outline" appointmentType="online-consultation" className={styles.onlineConsultationButton}>
                      Онлайн-консультация
                    </RecordButton>
                    <p className={styles.offerPrice}><strong>1 500 ₽</strong> · 30 минут</p>
                  </div>
                )}
              </div>
              <div className={styles.priceActions}>
                <a href="#doctor-prices" className={styles.textLink}>Стоимость консультации <span aria-hidden="true">→</span></a>
                {profile.slug === 'kim-alina' && (
                  <div className={styles.offerAction}>
                    <RecordButton variant="outline" appointmentType="exercise-collection" className={styles.exerciseCollectionButton}>
                      Купить сборник упражнений
                    </RecordButton>
                    <p className={styles.offerPrice}><strong>350 ₽</strong></p>
                  </div>
                )}
              </div>
            </div>
            <p className={styles.heroLocation}>Москва · метро «Парк Победы»</p>
          </div>
          <figure className={styles.portrait}>
            <img src={doctor.photo.src} alt={doctor.name} width="1829" height="2560" decoding="async" />
            <figcaption>{doctor.position}</figcaption>
          </figure>
        </header>

        <nav className={styles.pageNav} aria-label="На странице врача">
          <HashLink to="#doctor-biography">О враче</HashLink>
          {profile.education.length > 0 && <HashLink to="#doctor-education">Образование</HashLink>}
          {profile.documents.length > 0 && <HashLink to="#doctor-documents">Документы</HashLink>}
          <HashLink to="#doctor-prices">Цены</HashLink>
          <HashLink to="#doctor-location">Где проходит приём</HashLink>
        </nav>

        <div className={styles.bodyGrid}>
          <div className={styles.bodyContent}>
            <section id="doctor-biography" className={styles.section} aria-labelledby="doctor-biography-title">
              <p className={styles.sectionLabel}>Знакомство</p>
              <h2 id="doctor-biography-title">О враче</h2>
              {profile.biography.map(text => <p key={text}>{text}</p>)}
              {profile.qualifications.length > 0 && (
                <dl className={styles.qualifications}>
                  {profile.qualifications.map(({ label, value }) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
                </dl>
              )}
              {profile.sources?.length ? <div className={styles.sources}>{profile.sources.map(({ title, href }) => <a key={href} href={href} target="_blank" rel="noopener noreferrer">{title} ↗</a>)}</div> : null}
            </section>

            {profile.education.length > 0 && (
              <section id="doctor-education" className={styles.section} aria-labelledby="doctor-education-title">
                <p className={styles.sectionLabel}>Квалификация</p>
                <h2 id="doctor-education-title">Образование и повышение квалификации</h2>
                <ol className={styles.timeline}>
                  {profile.education.map(({ year, title, institution }) => (
                    <li key={`${year}-${title}`}><span className={styles.year}>{year}</span><div><h3>{title}</h3><p>{institution}</p></div></li>
                  ))}
                </ol>
              </section>
            )}

            {profile.career?.length ? (
              <section className={styles.section} aria-labelledby="doctor-career-title">
                <h2 id="doctor-career-title">Профессиональный путь</h2>
                <ol className={styles.timeline}>{profile.career.map(({ year, text }) => <li key={year}><span className={styles.year}>{year}</span><p>{text}</p></li>)}</ol>
              </section>
            ) : null}

            <section className={styles.section} aria-labelledby="doctor-interests-title">
              <h2 id="doctor-interests-title">Профессиональные интересы</h2>
              <ul className={styles.interests}>{profile.interests.map(interest => <li key={interest}>{interest}</li>)}</ul>
              <p className={styles.note}>Методы обследования и лечения врач подбирает после консультации с учётом состояния пациента.</p>
            </section>

            {(profile.accreditations?.length || profile.documents.length > 0) && (
              <section id="doctor-documents" className={styles.section} aria-labelledby="doctor-documents-title">
                <p className={styles.sectionLabel}>Образование и допуск к практике</p>
                <h2 id="doctor-documents-title">Документы и аккредитация</h2>
                {profile.documentNote && <p className={styles.note}>{profile.documentNote}</p>}
                {profile.accreditations?.length ? (
                  <dl className={styles.accreditations}>
                    {profile.accreditations.map(({ specialty, date, validUntil }) => (
                      <div key={specialty}><dt>{specialty}</dt><dd>Аккредитация от {date}, действительна до {validUntil}.</dd></div>
                    ))}
                  </dl>
                ) : null}
                <div className={styles.documents}>
                  {profile.documents.map((document, index) => (
                    <figure key={document.src}>
                      <a href={document.src} target="_blank" rel="noopener noreferrer" aria-label={`Открыть: ${document.label || `документ ${index + 1}`}`}>
                        <img src={document.src} alt={document.alt || document.label || `Документ об образовании — ${doctor.name}`} loading="lazy" decoding="async" />
                        <span className={styles.documentZoom} aria-hidden="true">Открыть документ ↗</span>
                      </a>
                      <figcaption>{document.label || `Документ ${index + 1}`}</figcaption>
                    </figure>
                  ))}
                </div>
              </section>
            )}

            <section id="doctor-prices" className={styles.section} aria-labelledby="doctor-prices-title">
              <p className={styles.sectionLabel}>Консультация</p>
              <h2 id="doctor-prices-title">Стоимость приёма</h2>
              <p>{profile.slug === 'tyan-viktoria' ? 'Консультации главного врача Тян Виктории Николаевны.' : 'Цены по общему прайсу для приёма врача-невролога.'}</p>
              <div className={styles.tableWrap}>
                <table className={styles.prices}>
                  <caption>Стоимость консультаций в Арти Клиник</caption>
                  <thead><tr><th scope="col">Приём</th><th scope="col">Время</th><th scope="col">Цена</th></tr></thead>
                  <tbody>{prices.map(item => (
                    <tr key={item.title}>
                      <th scope="row">{consultationLabel(item)}</th>
                      <td>{item.neurologyConsultation.durationMinutes ? `до ${item.neurologyConsultation.durationMinutes} минут` : 'Уточняется при записи'}</td>
                      <td className={styles.priceAmount}>{item.price}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
              <p className={styles.note}>Стоимость лечебных процедур указана отдельно. Доступное время приёма и его продолжительность уточняются при записи.</p>
              <Link to="/price-list" className={styles.textLink}>Полный прайс клиники →</Link>
            </section>

            {profile.publications?.length ? (
              <section id="doctor-publications" className={styles.section} aria-labelledby="doctor-publications-title">
                <h2 id="doctor-publications-title">Научные публикации</h2>
                <ul className={styles.publications}>{profile.publications.map(({ title, href, source }) => <li key={href}><a href={href} target="_blank" rel="noopener noreferrer">{title} ↗</a><span>{source}</span></li>)}</ul>
              </section>
            ) : null}

            <section id="doctor-reviews" className={styles.section} aria-labelledby="doctor-reviews-title">
              <h2 id="doctor-reviews-title">Отзывы пациентов</h2>
              <p>{profile.reviewsUrl ? 'Отзывы об этом враче доступны на внешней площадке.' : 'Отзывы об Арти Клиник можно прочитать на Яндекс Картах.'}</p>
              <a className={styles.textLink} href={profile.reviewsUrl || 'https://yandex.ru/maps/org/19149709238/reviews/'} target="_blank" rel="noopener noreferrer">{profile.reviewsUrl ? 'Отзывы о враче' : 'Отзывы о клинике'} ↗</a>
            </section>
          </div>

          <aside id="doctor-location" className={styles.locationCard} aria-labelledby="doctor-location-title">
            <p className={styles.sectionLabel}>Арти Клиник</p>
            <h2 id="doctor-location-title">Где проходит приём</h2>
            <p className={styles.metro}>Метро «Парк Победы»</p>
            <p>{clinicJsonLd.address.addressLocality}, {clinicJsonLd.address.streetAddress}. Вход со двора.</p>
            <a className={styles.textLink} href="https://yandex.ru/maps/org/19149709238" target="_blank" rel="noopener noreferrer">Построить маршрут ↗</a>
            <div className={styles.schedule}>
              <h3>Часы работы клиники</h3>
              <p>{CLINIC_SCHEDULE_TEXT}</p>
              <p className={styles.note}>Расписание приёма врача уточните у администратора.</p>
            </div>
            <div className={styles.phones}>
              <a href="tel:+74991481724">+7 (499) 148-17-24</a>
              <a href="tel:+79998310636">+7 (999) 831-06-36</a>
            </div>
            <RecordButton variant="primary">Записаться на приём</RecordButton>
          </aside>
        </div>
        <Link to="/doctors" className={styles.backLink}>← Все врачи Арти Клиник</Link>
      </main>
      <Footer />
    </>
  );
}
