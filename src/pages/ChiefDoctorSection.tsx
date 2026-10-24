import {
  useEffect,
  useMemo,
  useRef,
  useState,
  ReactNode,
  useCallback,
} from 'react';
import clsx from 'clsx';
import { Link, useLocation } from 'react-router-dom';

import type { DocItem } from '@/components/DocCarousel3D/DocCarousel3D';
import RecordButton from '@/components/RecordButton/RecordButton';
import TelegramButton from '@/components/TelegramButton/TelegramButton';
import SpecialistsIntro from '@/components/SpecialistsIntro';

import styles from '@/pages/ChiefDoctorSection.module.scss';

type Fact = { label: string; value: string; hint?: string };

type FeatureCard = {
  title: string;
  text: ReactNode;
};

type DoctorPhoto = {
  src: string;
  alt?: string;
  avatarSrc?: string;
  webp1x?: string;
  webp2x?: string;
  jpg1x?: string;
  jpg2x?: string;
};

export type Doctor = {
  id: string;
  name: string;
  position?: string;
  primarySpecialty?: string;
  bio: ReactNode;
  moreInfoTitle?: string;
  moreInfo?: ReactNode;
  photo: DoctorPhoto;
  docs: DocItem[];
  facts?: Fact[];
  experience?: string;
  rating?: number;
  reviewsCount?: number;

  /** ✅ фичи конкретного врача (левая колонка) */
  featureCards?: FeatureCard[];
};

export type ChiefDoctorSectionProps = {
  id?: string;
  title?: string;
  subtitle?: string;
  doctors: Doctor[];
  /** общий fallback, если у врача нет featureCards */
  features?: FeatureCard[];
};

export default function ChiefDoctorSection({
  id = 'specialists',
  title = 'Команда врачей Арти Клиник',
  subtitle,
  doctors,
  features,
}: ChiefDoctorSectionProps) {
  const { hash } = useLocation();
  const hashDoctorId = doctors.find(
    (doctor) => hash === `#doctor-${doctor.id}`
  )?.id;
  const [activeId, setActiveId] = useState<string | undefined>(
    () => hashDoctorId ?? doctors[0]?.id
  );
  const doctorCardRef = useRef<HTMLDivElement>(null);
  const pendingHashScroll = useRef<string | undefined>(hashDoctorId);

  // направление анимации: -1 = влево, 1 = вправо
  const [dir, setDir] = useState<-1 | 1>(1);

  const activeIndex = useMemo(
    () =>
      Math.max(
        0,
        doctors.findIndex((d) => d.id === activeId)
      ),
    [doctors, activeId]
  );

  const activeDoctor = useMemo(
    () => doctors[activeIndex] ?? doctors[0],
    [doctors, activeIndex]
  );

  useEffect(() => {
    pendingHashScroll.current = hashDoctorId;
    if (hashDoctorId) setActiveId(hashDoctorId);
  }, [hash, hashDoctorId]);

  useEffect(() => {
    if (!activeDoctor || pendingHashScroll.current !== activeDoctor.id) return;
    // Wait for the selected card's DOM; later avatar clicks keep their normal behavior.
    const frame = requestAnimationFrame(() => {
      doctorCardRef.current?.scrollIntoView({ block: 'start' });
      pendingHashScroll.current = undefined;
    });
    return () => cancelAnimationFrame(frame);
  }, [hash, hashDoctorId, activeDoctor?.id]);

  const defaultFeatureCards: FeatureCard[] = useMemo(
    () => [
      {
        title: 'Медицинское образование',
        text: (
          <p>
            Высшее медицинское образование и регулярное повышение квалификации
            по неврологии, мануальной терапии и рефлексотерапии.
          </p>
        ),
      },
      {
        title: 'Современные протоколы',
        text: (
          <p>
            Комбинируем неврологию, мануальные техники и реабилитацию — чтобы
            возвращать к привычной жизни без боли.
          </p>
        ),
      },
      {
        title: 'Персональная стратегия',
        text: (
          <p>
            План лечения строится вокруг ваших задач: работа, спорт, семья —
            измеряем прогресс и корректируем курс.
          </p>
        ),
      },
    ],
    []
  );

  const handleDoctorClick = useCallback(
    (id: string) => {
      if (id === activeId) return;
      const nextIndex = doctors.findIndex((d) => d.id === id);
      if (nextIndex === -1) return;

      setDir(nextIndex > activeIndex ? 1 : -1);
      setActiveId(id);
    },
    [activeId, doctors, activeIndex]
  );

  return (
    <section id={id} className={styles.section}>
      <div className={styles.bgGlow} aria-hidden="true" />
      <div className={styles.noise} aria-hidden="true" />

      <div className={styles.wrapper}>
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            {/* <p className={styles.kicker}>Команда специалистов Арти Клиник</p> */}
            <SpecialistsIntro title={title} />
            {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
          </div>
        </header>

        {/* Аватарки врачей */}
        <div className={styles.avatarsRow}>
          {doctors.map((doctor) => {
            const isActive = doctor.id === activeDoctor?.id;
            return (
              <button
                key={doctor.id}
                type="button"
                className={clsx(
                  styles.avatarItem,
                  isActive && styles.avatarItemActive
                )}
                onClick={() => handleDoctorClick(doctor.id)}
                aria-pressed={isActive}
              >
                <span className={styles.avatarImageWrap}>
                  <img
                    src={doctor.photo.avatarSrc || doctor.photo.src}
                    alt={doctor.photo.alt || doctor.name}
                    loading="lazy"
                    decoding="async"
                  />
                </span>
                {/* <span className={styles.avatarName}>{doctor.name}</span> */}
              </button>
            );
          })}
        </div>

        <div className={styles.mainGrid}>
          {/* Левая колонка — фичи врача */}
          <div className={styles.featuresStack}>
            {doctors.map(doctor => {
              const isActive = doctor.id === activeDoctor?.id;
              const featureCards = doctor.featureCards ?? features ?? defaultFeatureCards;

              return (
                <div
                  key={doctor.id}
                  aria-hidden={!isActive}
                  className={clsx(
                    styles.featuresColumn,
                    !isActive && styles.inactivePanel,
                    isActive && (dir === 1 ? styles.featuresSlideRight : styles.featuresSlideLeft)
                  )}
                >
                  {featureCards.map((card, idx) => (
                    <article key={idx} className={styles.featureCard}>
                      <h3 className={styles.featureTitle}>{card.title}</h3>
                      <div className={styles.featureText}>{card.text}</div>
                    </article>
                  ))}
                </div>
              );
            })}
          </div>

          {/* Правая колонка — активный врач */}
          <div className={styles.doctorColumn}>
            {doctors.map(doctor => {
              const isActive = doctor.id === activeDoctor?.id;
              const photo = doctor.photo;
              const facts = (doctor.facts ?? []).slice(0, 3);

              return (
                <div
                  key={doctor.id}
                  id={`doctor-${doctor.id}`}
                  ref={isActive ? doctorCardRef : undefined}
                  aria-hidden={!isActive}
                  style={{ scrollMarginTop: 'calc(var(--nav-h, 90px) + 16px)' }}
                  className={clsx(
                    styles.doctorCard,
                    !isActive && styles.inactivePanel,
                    isActive && (dir === 1
                      ? styles.doctorCardSlideRight
                      : styles.doctorCardSlideLeft)
                  )}
                >
                  {/* Левая часть */}
                  <div className={styles.doctorInfo}>
                    <div className={styles.doctorTitleBlock}>
                      <h3 className={styles.doctorName}>{doctor.name}</h3>

                      {(doctor.position ||
                        doctor.primarySpecialty) && (
                        <p className={styles.doctorPosition}>
                          {doctor.position}
                          {doctor.position &&
                            doctor.primarySpecialty &&
                            ' · '}
                          {doctor.primarySpecialty}
                        </p>
                      )}

                      <div className={styles.trustRow}>
                        {doctor.experience && (
                          <span className={styles.trustBadge}>
                            Стаж&nbsp;{doctor.experience}
                          </span>
                        )}

                        {typeof doctor.rating === 'number' && (
                          <span className={styles.trustRating}>
                            ★ {doctor.rating.toFixed(1)}
                            {typeof doctor.reviewsCount === 'number' && (
                              <span className={styles.trustReviews}>
                                &nbsp;· {doctor.reviewsCount} отзывов
                              </span>
                            )}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Био */}
                    <div className={styles.doctorBioWrapper}>
                      <div className={styles.doctorBio}>{doctor.bio}</div>
                    </div>

                    <div className={styles.metaRow}>
                      {facts.map((f, i) => (
                        <span key={i} className={styles.metaPill} title={f.hint}>
                          <span className={styles.metaLabel}>{f.label}:</span>{' '}
                          {f.value}
                        </span>
                      ))}
                    </div>

                    {/* Подробнее */}
                    <Link to={`/doctors/${doctor.id}`} className={styles.moreLink}>
                      Подробнее о враче
                    </Link>

                    <Link to="/services/nevrolog" className={styles.moreLink}>
                      Приём невролога: стоимость и запись
                    </Link>

                    <div className={styles.ctaRow}>
                      <RecordButton variant="primary">Записаться</RecordButton>
                      <TelegramButton to="@Artiklinic" variant="primary" />
                    </div>
                  </div>

                  {/* Фото */}
                  {photo && (
                    <figure className={styles.doctorPhotoCard}>
                      <div
                        className={styles.doctorPhotoGlow}
                        aria-hidden="true"
                      />
                      <div
                        className={styles.doctorPhotoVignette}
                        aria-hidden="true"
                      />

                      <picture>
                        {photo.webp2x && (
                          <source
                            srcSet={`${photo.webp1x || photo.webp2x} 1x, ${
                              photo.webp2x
                            } 2x`}
                            type="image/webp"
                          />
                        )}
                        {(photo.jpg1x || photo.jpg2x) && (
                          <source
                            srcSet={`${photo.jpg1x || photo.jpg2x} 1x, ${
                              photo.jpg2x || photo.jpg1x
                            } 2x`}
                            type="image/jpeg"
                          />
                        )}
                        <img
                          src={photo.src}
                          alt={photo.alt || doctor.name}
                          loading="lazy"
                          decoding="async"
                          className={styles.doctorPhoto}
                        />
                      </picture>

                      <figcaption className={styles.photoCaption}>
                        <span className={styles.photoCaptionRole}>
                          {doctor.position || 'Врач'}
                        </span>
                        {doctor.primarySpecialty && (
                          <span className={styles.photoCaptionSpec}>
                            {doctor.primarySpecialty}
                          </span>
                        )}
                      </figcaption>
                    </figure>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

    </section>
  );
}
