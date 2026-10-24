import { Link } from 'react-router-dom';
import SeoAuto from '@/components/SeoAuto';
import { NavBar } from '@/components/NavBar';
import { Footer } from '@/components/Footer';
import { CLINIC_SHARE_IMAGE, SITE_ORIGIN, clinicJsonLd } from '@/data/clinic';
import { doctorProfiles, getDoctorProfile, doctorConsultationMinimum } from '@/data/doctorProfiles';
import styles from './DoctorPages.module.scss';

export default function DoctorsIndex() {
  const profiles = doctorProfiles.flatMap(({ slug }) => {
    const profile = getDoctorProfile(slug);
    return profile ? [profile] : [];
  });
  return (
    <>
      <SeoAuto
        title="Врачи Арти Клиник в Москве — неврологи у метро Парк Победы"
        description="Врачи Арти Клиник: Тян Виктория Николаевна и Ким Алина Александровна. Профили специалистов, образование, документы и стоимость приёма в Москве."
        images={CLINIC_SHARE_IMAGE}
        jsonLd={[
          { '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'Врачи Арти Клиник', url: `${SITE_ORIGIN}/doctors`, mainEntity: {
            '@type': 'ItemList', itemListElement: profiles.map(({ slug, doctor }, index) => ({ '@type': 'ListItem', position: index + 1, name: doctor.name, url: `${SITE_ORIGIN}/doctors/${slug}` })),
          } },
          clinicJsonLd,
          { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Главная', item: `${SITE_ORIGIN}/` },
            { '@type': 'ListItem', position: 2, name: 'Врачи', item: `${SITE_ORIGIN}/doctors` },
          ] },
        ]}
      />
      <NavBar />
      <main className={`container ${styles.main}`}>
        <nav className={styles.breadcrumbs} aria-label="Хлебные крошки"><Link to="/">Главная</Link><span aria-hidden="true">/</span><span aria-current="page">Врачи</span></nav>
        <header className={styles.indexHeader}>
          <p className={styles.eyebrow}>Команда специалистов</p>
          <h1>Врачи Арти Клиник</h1>
          <p>Познакомьтесь с врачами, узнайте об их образовании и направлениях работы. Приём проходит в Москве, рядом с метро «Парк Победы».</p>
        </header>
        <section id="doctors-approach" className={styles.approach} aria-labelledby="doctors-approach-title">
          <h2 id="doctors-approach-title">Подход Арти Клиник</h2>
          <div className={styles.approachCopy}>
            <p>
              Врачи клиники — уникальные специалисты: каждый владеет сразу тремя
              направлениями — неврологией, рефлексотерапией и мануальной терапией.
              Это позволяет точнее разобраться в проблеме и сделать лечение
              максимально эффективным. Не нужно бегать от одного врача к другому
              и собирать противоречивые рекомендации — всё сосредоточено в одних
              руках. Такой подход позволяет снизить общую стоимость лечения:
              не придётся оплачивать множество разрозненных приёмов у разных
              специалистов.
            </p>
            <p>
              В «Арти Клиник» делают ставку на безопасные и доказательные методы
              нелекарственной терапии, а при необходимости грамотно сочетают их
              с медикаментозным лечением — всё под контролем опытных врачей.
            </p>
            <p>
              Главная цель «Арти Клиник» — не просто убрать боль, а помочь организму
              восстановиться и дальше справляться с нагрузками без срывов.
              Результат — не временное облегчение, а стабильное улучшение
              самочувствия и возвращение к привычной жизни.
            </p>
          </div>
        </section>
        <div className={styles.directory}>
          {profiles.map(profile => {
            const { doctor } = profile;
            const price = doctorConsultationMinimum(profile);
            return (
              <article key={profile.slug} className={styles.directoryCard}>
                <Link className={styles.directoryPhoto} to={`/doctors/${profile.slug}`} aria-label={`Профиль врача: ${doctor.name}`}>
                  <img src={doctor.photo.src} alt={doctor.name} width="1829" height="2560" loading="lazy" decoding="async" />
                </Link>
                <div className={styles.directoryBody}>
                  <p className={styles.eyebrow}>{doctor.position}</p>
                  <h2><Link to={`/doctors/${profile.slug}`}>{doctor.name}</Link></h2>
                  <p>{profile.introduction}</p>
                  {price !== undefined && <p className={styles.startingPrice}>Приём от <strong>{price.toLocaleString('ru-RU')} ₽</strong></p>}
                  <Link to={`/doctors/${profile.slug}`} className={styles.directoryLink}>
                    <span className={styles.directoryLinkText}>Профиль врача</span>
                    <span aria-hidden="true">→</span>
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
        <div className={styles.directoryFootnote}>
          <Link to="/services/nevrolog">
            <span className={styles.directoryLinkText}>Как проходит приём невролога</span>
            <span aria-hidden="true">→</span>
          </Link>
          <Link to="/price-list">
            <span className={styles.directoryLinkText}>Цены на консультации и лечение</span>
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
