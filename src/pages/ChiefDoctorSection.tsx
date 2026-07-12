// import DocCarousel3D, {
//   DocItem,
// } from '@/components/DocCarousel3D/DocCarousel3D';
// import React, { useEffect, useMemo, useRef, useState } from 'react';
// import ReactDOM from 'react-dom';
// import clsx from 'clsx';
// import styles from '@/pages/ChiefDoctorSection.module.scss';
// import RecordButton from '@/components/RecordButton/RecordButton';
// import TelegramButton from '@/components/TelegramButton/TelegramButton';
// import DocSliderFade from '@/components/DocSliderFade/DocSliderFade';
//
// type Fact = { label: string; value: string; hint?: string };
//
// type ModalProps = {
//   open: boolean;
//   onClose: () => void;
//   title: string;
//   children: React.ReactNode;
// };
//
// /** Лёгкое модальное окно: портал в body, ESC/фон — закрытие, фокус на заголовок */
// function Modal({ open, onClose, title, children }: ModalProps) {
//   const titleRef = useRef<HTMLHeadingElement>(null);
//
//   useEffect(() => {
//     if (!open) return;
//
//     const onKey = (e: KeyboardEvent) => {
//       if (e.key === 'Escape') onClose();
//     };
//     document.addEventListener('keydown', onKey);
//
//     // запрет прокрутки под модалкой
//     const prevOverflow = document.documentElement.style.overflow;
//     document.documentElement.style.overflow = 'hidden';
//
//     // фокус на заголовок
//     const t = requestAnimationFrame(() => titleRef.current?.focus());
//
//     return () => {
//       document.removeEventListener('keydown', onKey);
//       document.documentElement.style.overflow = prevOverflow;
//       cancelAnimationFrame(t);
//     };
//   }, [open, onClose]);
//
//   if (!open) return null;
//   const root = typeof document !== 'undefined' ? document.body : null;
//   if (!root) return null;
//
//   return ReactDOM.createPortal(
//     <div
//       className={styles.modalBackdrop}
//       role="presentation"
//       onClick={(e) => {
//         if (e.target === e.currentTarget) onClose();
//       }}
//     >
//       <div
//         className={styles.modal}
//         role="dialog"
//         aria-modal="true"
//         aria-labelledby="chief-doctor-moreinfo-title"
//       >
//         <button
//           type="button"
//           className={styles.modalClose}
//           onClick={onClose}
//           aria-label="Закрыть"
//         >
//           ×
//         </button>
//
//         <h3
//           id="chief-doctor-moreinfo-title"
//           className={styles.modalTitle}
//           tabIndex={-1}
//           ref={titleRef}
//         >
//           {title}
//         </h3>
//
//         <div className={styles.modalContent}>{children}</div>
//       </div>
//     </div>,
//     root
//   );
// }
//
// export type ChiefDoctorSectionProps = {
//   id?: string;
//   name: string;
//   position?: string; // "Главный врач"
//   primarySpecialty?: string; // "Невролог"
//   about: React.ReactNode; // React-контент с разметкой
//   photo: {
//     src: string;
//     alt?: string;
//     webp2x?: string;
//     webp1x?: string;
//     jpg2x?: string;
//     jpg1x?: string;
//   };
//   docs: DocItem[];
//   facts?: Fact[];
//   cta?: {
//     primaryHref?: string;
//     primaryLabel?: string; // "Записаться"
//     secondaryHref?: string;
//     secondaryLabel?: string; // "Задать вопрос"
//   };
//   panelWidth?: number;
//   panelHeight?: number;
//   className?: string;
//
//   /** Контент для модального "Больше информации" */
//   moreInfoTitle?: string; // по умолчанию: "О докторе"
//   moreInfo?: React.ReactNode; // по умолчанию: about
// };
//
// function useIsNarrow(max = 1249) {
//   const get = () =>
//     typeof window === 'undefined' ? null : window.innerWidth <= max;
//   const [state, setState] = useState<boolean | null>(get());
//   useEffect(() => {
//     const onR = () => setState(get());
//     window.addEventListener('resize', onR, { passive: true });
//     setState(get());
//     return () => window.removeEventListener('resize', onR);
//   }, []);
//   return state;
// }
//
// export default function ChiefDoctorSection({
//   id = 'chief-doctor',
//   name,
//   position = 'Главный врач',
//   primarySpecialty,
//   about,
//   photo,
//   docs,
//   facts = [
//     { label: 'Опыт', value: '30+ лет' },
//     { label: 'Пациентов/год', value: '1200+' },
//     { label: 'Профиль', value: primarySpecialty || 'Главный - врач' },
//   ],
//   cta = {
//     primaryHref: '#record',
//     primaryLabel: 'Записаться',
//     secondaryHref: '#contact',
//     secondaryLabel: 'Задать вопрос',
//   },
//   panelWidth = 420,
//   panelHeight = 452,
//   className,
//   moreInfoTitle = 'О докторе',
//   moreInfo,
// }: ChiefDoctorSectionProps) {
//   const hasDocs = docs && docs.length > 0;
//   const isNarrow = useIsNarrow(1249);
//   const [isMoreInfoOpen, setMoreInfoOpen] = useState(false);
//
//   // ограничим количество фактов до 4 для эстетики
//   const safeFacts = useMemo(() => facts.slice(0, 4), [facts]);
//
//   return (
//     <section id={id} className={clsx(styles.section, className)}>
//       <div className={styles.container}>
//         {/* Левая колонка */}
//         <aside className={styles.left}>
//           <figure className={styles.photoCard}>
//             <picture>
//               {photo.webp2x && (
//                 <source
//                   srcSet={`${photo.webp1x || photo.webp2x} 1x, ${
//                     photo.webp2x
//                   } 2x`}
//                   type="image/webp"
//                 />
//               )}
//               {(photo.jpg2x || photo.jpg1x) && (
//                 <source
//                   srcSet={`${photo.jpg1x || photo.jpg2x} 1x, ${
//                     photo.jpg2x || photo.jpg1x
//                   } 2x`}
//                   type="image/jpeg"
//                 />
//               )}
//               <img
//                 loading="lazy"
//                 decoding="async"
//                 src={photo.src}
//                 alt={photo.alt || name}
//                 className={styles.photo}
//               />
//             </picture>
//             <figcaption className={styles.caption}>
//               <span className={styles.position}>{position}</span>
//               <span className={styles.name}>{name}</span>
//               {primarySpecialty && (
//                 <span className={styles.specialty}>{primarySpecialty}</span>
//               )}
//             </figcaption>
//             <div className={styles.glow} aria-hidden="true" />
//           </figure>
//
//           {(safeFacts.length > 0 || true) && (
//             <ul className={styles.facts} role="list">
//               {safeFacts.map((f, i) => (
//                 <li key={i} className={styles.factItem}>
//                   <span className={styles.factValue}>{f.value}</span>
//                   <span className={styles.factLabel}>
//                     {f.label}
//                     {f.hint && <em className={styles.factHint}> · {f.hint}</em>}
//                   </span>
//                 </li>
//               ))}
//
//               {/* Доп. пункт — ссылка, открывающая модалку */}
//               <li className={clsx(styles.factItem, styles.moreInfoItem)}>
//                 <button
//                   type="button"
//                   className={styles.moreInfoLink}
//                   onClick={() => setMoreInfoOpen(true)}
//                   aria-haspopup="dialog"
//                   aria-controls="chief-doctor-moreinfo"
//                 >
//                   Больше информации
//                 </button>
//               </li>
//             </ul>
//           )}
//
//           <div className={styles.ctaRow}>
//             {cta.primaryHref && (
//               <RecordButton variant="primary">Записаться</RecordButton>
//             )}
//             {cta.secondaryHref && (
//               <TelegramButton to="@Artiklinic" variant="primary" />
//             )}
//           </div>
//         </aside>
//
//         {/* Правая колонка */}
//         <div className={styles.right}>
//           <div className={styles.aboutCard}>
//             <div className={styles.kicker}>
//               Экспертный подход · Персональная терапия
//             </div>
//             <h2 className={styles.h2}>
//               Забота, основанная на доказательной медицине
//             </h2>
//             <div className={styles.aboutText}>{about}</div>
//
//             <blockquote className={styles.quote}>
//               <span className={styles.quoteMark} aria-hidden="true">
//                 “
//               </span>
//               <p>
//                 Мы лечим не диагноз, а человека с его целями, ритмом жизни и
//                 будущими планами. Результат — это когда пациент возвращается к
//                 любимым делам без боли.
//               </p>
//               <span className={styles.quoteMark} aria-hidden="true">
//                 ”
//               </span>
//             </blockquote>
//           </div>
//
//           {hasDocs && (
//             <div className={styles.docsCard}>
//               <div className={styles.docsHeader}>
//                 <h3 className={styles.h3}>Документы и сертификаты</h3>
//                 <p className={styles.subtle}>
//                   Подтверждение квалификации и повышения квалификации.
//                 </p>
//               </div>
//
//               {isNarrow === null ? (
//                 <div
//                   style={{
//                     height: panelHeight,
//                     borderRadius: 20,
//                     background: 'rgba(0,0,0,0.03)',
//                   }}
//                 />
//               ) : isNarrow ? (
//                 <DocSliderFade
//                   items={docs}
//                   panelWidth={Math.min(360, panelWidth)}
//                   panelHeight={Math.min(420, panelHeight)}
//                   intervalMs={4200}
//                 />
//               ) : (
//                 <DocCarousel3D
//                   items={docs}
//                   panelWidth={panelWidth}
//                   panelHeight={panelHeight}
//                 />
//               )}
//
//               <p className={styles.hint}>
//                 Листайте документы. Клик — открыть деталь.
//               </p>
//             </div>
//           )}
//         </div>
//       </div>
//
//       {/* Модалка "Больше информации" */}
//       <Modal
//         open={isMoreInfoOpen}
//         onClose={() => setMoreInfoOpen(false)}
//         title={moreInfoTitle || 'О докторе'}
//       >
//         <div id="chief-doctor-moreinfo">{moreInfo ?? about}</div>
//       </Modal>
//     </section>
//   );
// }
//


import {
  useEffect,
  useMemo,
  useRef,
  useState,
  ReactNode,
  useCallback,
} from 'react';
import ReactDOM from 'react-dom';
import clsx from 'clsx';

import DocCarousel3D, {
  DocItem,
} from '@/components/DocCarousel3D/DocCarousel3D';
import DocSliderFade from '@/components/DocSliderFade/DocSliderFade';
import RecordButton from '@/components/RecordButton/RecordButton';
import TelegramButton from '@/components/TelegramButton/TelegramButton';

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

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
};

function Modal({ open, onClose, title, children }: ModalProps) {
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);

    const prevOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';

    const t = requestAnimationFrame(() => titleRef.current?.focus());

    return () => {
      document.removeEventListener('keydown', onKey);
      document.documentElement.style.overflow = prevOverflow;
      cancelAnimationFrame(t);
    };
  }, [open, onClose]);

  if (!open) return null;
  const root = typeof document !== 'undefined' ? document.body : null;
  if (!root) return null;

  return ReactDOM.createPortal(
    <div
      className={styles.modalBackdrop}
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="doctor-modal-title"
      >
        <button
          type="button"
          className={styles.modalClose}
          onClick={onClose}
          aria-label="Закрыть"
        >
          ×
        </button>

        <h3
          id="doctor-modal-title"
          className={styles.modalTitle}
          tabIndex={-1}
          ref={titleRef}
        >
          {title}
        </h3>

        <div className={styles.modalContent}>{children}</div>
      </div>
    </div>,
    root
  );
}

function useIsNarrow(max = 1024) {
  const get = () =>
    typeof window === 'undefined' ? null : window.innerWidth <= max;
  const [state, setState] = useState<boolean | null>(get());

  useEffect(() => {
    const onR = () => setState(get());
    window.addEventListener('resize', onR, { passive: true });
    setState(get());
    return () => window.removeEventListener('resize', onR);
  }, []);

  return state;
}

/** ✅ Документы: без превью, просто премиальный бар */
function DocsBar({ onOpen }: { items: DocItem[]; onOpen: () => void }) {
  return (
    <div className={styles.docsBar}>
      <div className={styles.docsBarLeft}>
        <span className={styles.docsBarIcon} aria-hidden="true">
          <svg viewBox="0 0 24 24" width="18" height="18">
            <path
              fill="currentColor"
              d="M7 3h7l3 3v15a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zm7 1.5V7h2.5L14 4.5zM8 10h7v1.5H8V10zm0 3h7v1.5H8V13zm0 3h5v1.5H8V16z"
            />
          </svg>
        </span>

        <div className={styles.docsBarText}>
          <div className={styles.docsBarTitle}>Документы и сертификаты</div>
          <div className={styles.docsBarSub}>
            дипломы, сертификаты, повышение квалификации
          </div>
        </div>
      </div>

      <button type="button" className={styles.docsBarButton} onClick={onOpen}>
        Открыть
      </button>
    </div>
  );
}

export default function ChiefDoctorSection({
  id = 'specialists',
  title = 'Команда врачей Арти Клиник',
  subtitle,
  doctors,
  features,
}: ChiefDoctorSectionProps) {
  const [activeId, setActiveId] = useState<string | undefined>(doctors[0]?.id);
  const [modalType, setModalType] = useState<'info' | 'docs' | null>(null);

  // направление анимации: -1 = влево, 1 = вправо
  const [dir, setDir] = useState<-1 | 1>(1);

  const isNarrow = useIsNarrow(1024);

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
  const activePhoto = activeDoctor?.photo;

  const safeFacts = useMemo(
    () => (activeDoctor?.facts ?? []).slice(0, 3),
    [activeDoctor]
  );

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

  const featureCards: FeatureCard[] = useMemo(() => {
    return activeDoctor?.featureCards ?? features ?? defaultFeatureCards;
  }, [activeDoctor, features, defaultFeatureCards]);

  const hasDocs = !!activeDoctor?.docs?.length;

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
            <p className={styles.kicker}>Команда специалистов Арти Клиник</p>
            <h2 className={styles.title}>{title}</h2>
            {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
          </div>

          {/* <div className={styles.headerRight}>
            <button type="button" className={styles.allButton}>
              Все специалисты
            </button>
          </div> */}
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
          <div
            key={`features-${activeDoctor?.id ?? 'default'}`}
            className={clsx(
              styles.featuresColumn,
              dir === 1 ? styles.featuresSlideRight : styles.featuresSlideLeft
            )}
          >
            {featureCards.map((card, idx) => (
              <article key={idx} className={styles.featureCard}>
                <h3 className={styles.featureTitle}>{card.title}</h3>
                <div className={styles.featureText}>{card.text}</div>
              </article>
            ))}
          </div>

          {/* Правая колонка — активный врач */}
          {activeDoctor && (
            <div className={styles.doctorColumn}>
              <div
                key={activeDoctor.id}
                className={clsx(
                  styles.doctorCard,
                  dir === 1
                    ? styles.doctorCardSlideRight
                    : styles.doctorCardSlideLeft
                )}
              >
                {/* Левая часть */}
                <div className={styles.doctorInfo}>
                  <div className={styles.doctorTitleBlock}>
                    <h3 className={styles.doctorName}>{activeDoctor.name}</h3>

                    {(activeDoctor.position ||
                      activeDoctor.primarySpecialty) && (
                      <p className={styles.doctorPosition}>
                        {activeDoctor.position}
                        {activeDoctor.position &&
                          activeDoctor.primarySpecialty &&
                          ' · '}
                        {activeDoctor.primarySpecialty}
                      </p>
                    )}

                    <div className={styles.trustRow}>
                      {activeDoctor.experience && (
                        <span className={styles.trustBadge}>
                          Стаж&nbsp;{activeDoctor.experience}
                        </span>
                      )}

                      {typeof activeDoctor.rating === 'number' && (
                        <span className={styles.trustRating}>
                          ★ {activeDoctor.rating.toFixed(1)}
                          {typeof activeDoctor.reviewsCount === 'number' && (
                            <span className={styles.trustReviews}>
                              &nbsp;· {activeDoctor.reviewsCount} отзывов
                            </span>
                          )}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Био */}
                  <div className={styles.doctorBioWrapper}>
                    <div className={styles.doctorBio}>{activeDoctor.bio}</div>
                  </div>

                  <div className={styles.metaRow}>
                    {safeFacts.map((f, i) => (
                      <span key={i} className={styles.metaPill} title={f.hint}>
                        <span className={styles.metaLabel}>{f.label}:</span>{' '}
                        {f.value}
                      </span>
                    ))}
                  </div>

                  {/* Документы — без превью */}
                  {hasDocs && (
                    <DocsBar
                      items={activeDoctor.docs}
                      onOpen={() => setModalType('docs')}
                    />
                  )}

                  {/* Подробнее */}
                  {activeDoctor.moreInfo && (
                    <button
                      type="button"
                      className={styles.moreLink}
                      onClick={() => setModalType('info')}
                    >
                      Подробнее о враче
                    </button>
                  )}

                  <div className={styles.ctaRow}>
                    <RecordButton variant="primary">Записаться</RecordButton>
                    <TelegramButton to="@Artiklinic" variant="primary" />
                  </div>
                </div>

                {/* Фото */}
                {activePhoto && (
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
                      {activePhoto.webp2x && (
                        <source
                          srcSet={`${activePhoto.webp1x || activePhoto.webp2x} 1x, ${
                            activePhoto.webp2x
                          } 2x`}
                          type="image/webp"
                        />
                      )}
                      {(activePhoto.jpg1x || activePhoto.jpg2x) && (
                        <source
                          srcSet={`${activePhoto.jpg1x || activePhoto.jpg2x} 1x, ${
                            activePhoto.jpg2x || activePhoto.jpg1x
                          } 2x`}
                          type="image/jpeg"
                        />
                      )}
                      <img
                        src={activePhoto.src}
                        alt={activePhoto.alt || activeDoctor.name}
                        loading="lazy"
                        decoding="async"
                        className={styles.doctorPhoto}
                      />
                    </picture>

                    <figcaption className={styles.photoCaption}>
                      <span className={styles.photoCaptionRole}>
                        {activeDoctor.position || 'Врач'}
                      </span>
                      {activeDoctor.primarySpecialty && (
                        <span className={styles.photoCaptionSpec}>
                          {activeDoctor.primarySpecialty}
                        </span>
                      )}
                    </figcaption>
                  </figure>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Модалки */}
      {activeDoctor && modalType === 'info' && activeDoctor.moreInfo && (
        <Modal
          open={true}
          onClose={() => setModalType(null)}
          title={activeDoctor.moreInfoTitle || activeDoctor.name}
        >
          <div id="doctor-moreinfo">{activeDoctor.moreInfo}</div>
        </Modal>
      )}

      {activeDoctor && modalType === 'docs' && hasDocs && (
        <Modal
          open={true}
          onClose={() => setModalType(null)}
          title={`Документы и сертификаты — ${activeDoctor.name}`}
        >
          <div className={styles.docsModalBody}>
            {isNarrow === null ? (
              <div className={styles.docsPlaceholder} />
            ) : isNarrow ? (
              <DocSliderFade
                items={activeDoctor.docs}
                panelWidth={360}
                panelHeight={440}
                intervalMs={4200}
              />
            ) : (
              <DocCarousel3D
                items={activeDoctor.docs}
                panelWidth={520}
                panelHeight={440}
              />
            )}
          </div>
          <p className={styles.docsModalHint}>
            Листайте, чтобы посмотреть дипломы, сертификаты и повышение
            квалификации.
          </p>
        </Modal>
      )}
    </section>
  );
}
