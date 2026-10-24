import { Link } from 'react-router-dom';
import RecordButton from '@/components/RecordButton/RecordButton';
import LavaBackground from '@/components/LavaBackground';
import { primaryConsultationMinimum } from '@/data/neurologistConsultation';
import styles from './NeurologistFeature.module.scss';

const consultationSteps = [
  { title: 'Неврологический осмотр', text: 'Оценка чувствительности, мышечной силы и рефлексов.' },
  { title: 'Разбор обследований', text: 'Обсудим имеющиеся заключения и снимки.' },
  { title: 'План дальнейших действий', text: 'Рекомендации по обследованию и лечению.' },
];

export default function NeurologistFeature() {
  return (
    <section id="neurologist-consultation" className={`section ${styles.section}`} aria-labelledby="neurologist-feature-title">
      <div className="container">
        <div className={styles.card}>
          <LavaBackground className={styles.lavaBackground} />
          <div className={styles.content}>
            <p className={styles.eyebrow}>Начните с консультации</p>
            <h2 id="neurologist-feature-title" className={styles.title}>Приём невролога</h2>
            <p className={styles.description}>
              Боль в спине или шее, онемение, прострелы? Врач поможет разобраться
              в жалобах и определить, что делать дальше.
            </p>
            <div className={styles.actions}>
              <Link to="/services/nevrolog" className={styles.details}>
                О приёме и стоимости
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden="true">
                  <path d="M5 12h14m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
              <RecordButton className={styles.booking} ariaLabel="Записаться к неврологу" size="14px">
                Записаться к неврологу
              </RecordButton>
            </div>
            <div className={styles.location}>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
                <path d="M19 10c0 5-7 10-7 10S5 15 5 10a7 7 0 1 1 14 0Z" stroke="currentColor" strokeWidth="1.5" />
                <circle cx="12" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.5" />
              </svg>
              Москва · метро «Парк Победы»
            </div>
          </div>

          <div className={styles.summary}>
            <h3 className={styles.summaryTitle}>На приёме</h3>
            <ol className={styles.steps}>
              {consultationSteps.map(({ title, text }, index) => (
                <li key={title}>
                  <span className={styles.stepNumber} aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
                  <div><h4>{title}</h4><p>{text}</p></div>
                </li>
              ))}
            </ol>
            <div className={styles.priceRow}>
              <span>Первичный приём</span>
              {primaryConsultationMinimum !== undefined && (
                <p className={styles.price}><span>от</span> {primaryConsultationMinimum.toLocaleString('ru-RU')} <span>₽</span></p>
              )}
            </div>
          </div>

          <div className={styles.footer}>
            {/* <div className={styles.avatars}>
              {doctors.map(({ id, name, photo }) => (
                <img key={id} src={photo.avatarSrc || photo.src} alt={name}
                  width="44" height="44" loading="lazy" decoding="async" />
              ))}
            </div> */}
            {/* <p>Приём ведут <span>неврологи Арти Клиник</span></p> */}
            <Link to="/doctors" className={styles.doctorsLink}>
              <span className={styles.doctorsLinkText}>Познакомиться с врачами</span>
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden="true">
                <path d="M6 18 18 6M6 6h12v12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
