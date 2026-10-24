import { Link } from 'react-router-dom';
import { HashLink } from 'react-router-hash-link';
import { doctors } from '@/data/doctors';
import { clinicJsonLd, CLINIC_SCHEDULE_TEXT } from '@/data/clinic';
import {
  consultationLabel,
  neurologistArticles,
  neurologistConsultationPrices,
} from '@/data/neurologistConsultation';
import tyanAvatar from '@/assets/tyan-viktoria-consultation-avatar.webp';
import kimAvatar from '@/assets/kim-alina-consultation-avatar.webp';
import styles from './NeurologistConsultation.module.scss';

const consultationAvatars: Record<string, string> = {
  'tyan-viktoria': tyanAvatar,
  'kim-alina': kimAvatar,
};

const clinicMapsUrl = 'https://yandex.ru/maps/org/19149709238';
const clinicMapImageUrl = 'https://api-maps.yandex.ru/services/constructor/1.0/static/?um=constructor%3A36a05065fdb74d8fc24a80537025028adf2c62fa1de162cfbfa0a0c7bb518f1b&width=650&height=320&lang=ru_RU';

export default function NeurologistConsultation() {
  return (
    <>
      <section id="consultation-prices" className={styles.section} aria-labelledby="consultation-prices-title">
        <h2 id="consultation-prices-title">Стоимость приёма невролога</h2>
        <p>Стоимость зависит от выбранного врача, формата и продолжительности консультации.</p>
        <div className={styles.tableWrap}>
          <table className={styles.prices}>
            <caption className={styles.caption}>Осмотр и консультация: цены из прайса Арти Клиник</caption>
            <thead>
              <tr><th scope="col">Приём</th><th scope="col">Время</th><th scope="col">Цена</th></tr>
            </thead>
            <tbody>
              {neurologistConsultationPrices.map((item) => {
                const { durationMinutes, doctorId } = item.neurologyConsultation;
                const doctor = doctorId ? doctors.find(({ id }) => id === doctorId) : undefined;
                return (
                  <tr key={item.title}>
                    <th scope="row">
                      {consultationLabel(item)}
                      {doctor && <span className={styles.priceDoctor}>{doctor.name}</span>}
                    </th>
                    <td>{durationMinutes ? `до ${durationMinutes} минут` : 'Уточняется при записи'}</td>
                    <td className={styles.amount}>{item.price}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className={styles.note}>Цены на лечебные процедуры — в общем прайсе. Продолжительность повторного приёма уточните при записи.</p>
        <HashLink to="/price-list#консультация-специалистов">Все цены на консультации и лечение →</HashLink>
      </section>

      <section className={styles.section} aria-labelledby="neurologists-title">
        <h2 id="neurologists-title">Неврологи Арти Клиник</h2>
        <div className={styles.doctors}>
          {doctors.map((doctor) => (
            <article key={doctor.id} className={styles.doctor}>
              <div className={styles.doctorHeader}>
                <img src={consultationAvatars[doctor.id] ?? doctor.photo.src} alt={doctor.photo.alt}
                  width={96} height={96} loading="lazy" decoding="async" />
                <div>
                  <h3>{doctor.name}</h3>
                  <p className={styles.note}>{doctor.position}</p>
                </div>
              </div>
              {doctor.primarySpecialty && <p className={styles.specialty}>{doctor.primarySpecialty}</p>}
              <div className={styles.bio}>{doctor.bio}</div>
              <Link to={`/doctors/${doctor.id}`} className={styles.profileLink}>Профиль врача →</Link>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.section} aria-labelledby="neurologist-symptoms-title">
        <h2 id="neurologist-symptoms-title">С чем обратиться к неврологу</h2>
        <ul className={styles.list}>
          <li>Боль в спине, шее или пояснице, которая повторяется или мешает привычным делам.</li>
          <li>Прострелы, боль с распространением в руку или ногу.</li>
          <li>Онемение, покалывание, изменение чувствительности.</li>
          <li>Вопросы о грыже или протрузии по результатам уже выполненных обследований.</li>
          <li>Жалобы, связанные с туннельными синдромами, и необходимость обсудить дальнейший план лечения.</li>
        </ul>
        <p className={styles.note}>Причину жалоб врач определяет на приёме: один и тот же симптом может быть связан с разными состояниями.</p>
        <aside className={styles.urgent} aria-labelledby="urgent-care-title">
          <h3 id="urgent-care-title">Когда нужна срочная помощь</h3>
          <p>При внезапной слабости руки или ноги, нарушении речи или асимметрии лица немедленно вызывайте скорую помощь по номеру <a href="tel:103">103</a> или <a href="tel:112">112</a>.</p>
        </aside>
      </section>

      <section className={styles.section} aria-labelledby="neurologist-preparation-title">
        <h2 id="neurologist-preparation-title">Как подготовиться к консультации</h2>
        <ul className={styles.list}>
          <li>Возьмите имеющиеся заключения врачей, результаты обследований и снимки, если они есть.</li>
          <li>Запишите, когда появились жалобы, где ощущается боль, что её усиливает или облегчает.</li>
          <li>Подготовьте список принимаемых лекарств и их дозировок.</li>
          <li>Составьте вопросы, которые хотите обсудить с врачом.</li>
        </ul>
      </section>

      <section className={styles.section} aria-labelledby="neurologist-address-title">
        <h2 id="neurologist-address-title">Где проходит приём</h2>
        <p>Арти Клиник: {clinicJsonLd.address.addressLocality}, {clinicJsonLd.address.streetAddress}. Вход со двора.</p>
        <p>Клиника находится рядом с метро «Парк Победы». Удобный маршрут можно посмотреть на карте.</p>
        <a className={styles.mapPreview} href={clinicMapsUrl} target="_blank" rel="noopener noreferrer">
          <img src={clinicMapImageUrl} width={650} height={320} loading="lazy" decoding="async"
            alt="Арти Клиник на карте Москвы — улица 1812 года, дом 3, рядом с метро Парк Победы" />
          <span className={styles.mapCaption}>
            <span>Арти Клиник на Яндекс Картах</span>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden="true">
              <path d="M6 18 18 6M6 6h12v12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </a>
        <p>Часы работы клиники: {CLINIC_SCHEDULE_TEXT}. Доступное время приёма выбранного врача уточняется при записи.</p>
        <div className={styles.links}>
          <a href={clinicMapsUrl} target="_blank" rel="noopener noreferrer">Построить маршрут на Яндекс Картах</a>
          <a href="tel:+74991481724">+7 (499) 148-17-24</a>
          <a href="tel:+79998310636">+7 (999) 831-06-36</a>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="neurologist-reading-title">
        <h2 id="neurologist-reading-title">Подробнее о консультации и боли в спине</h2>
        <ul className={styles.list}>
          {neurologistArticles.map(({ href, title }) => <li key={href}><Link to={href}>{title}</Link></li>)}
        </ul>
        {/* <p className={styles.note}>Справочная информация об осмотре: <a href="https://medlineplus.gov/lab-tests/neurological-exam/" target="_blank" rel="noopener noreferrer">MedlinePlus</a>. О признаках инсульта: <a href="https://dc2.mos.ru/publikacii/insult25" target="_blank" rel="noopener noreferrer">КДЦ № 2 ДЗМ</a>. О вызове скорой помощи: <a href="https://gp219.mos.ru/question" target="_blank" rel="noopener noreferrer">Городская поликлиника № 219 ДЗМ</a>.</p> */}
      </section>
    </>
  );
}
