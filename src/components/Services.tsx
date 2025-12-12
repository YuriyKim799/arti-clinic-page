import React from 'react';
import styles from './Services.module.scss';
import { useInView } from '../useInView';
import { servicesData } from '../data/services';
import { Link } from 'react-router-dom';

export const Services: React.FC = () => {
  const { ref, isIntersecting } = useInView<HTMLDivElement>();
  const list = [...servicesData].sort(
    (a, b) => (b.priority ?? 0) - (a.priority ?? 0)
  );

  return (
    <section id="services" className={`section ${styles.section}`}>
      <div
        ref={ref}
        className={`container reveal ${isIntersecting ? 'is-visible' : ''}`}
      >
        <h2 className="section-title">Услуги</h2>
        <div className={styles.grid}>
          {list.map((s) => (
            <article key={s.slug} className={styles.card}>
              <div className={styles.imageWrap}>
                <img src={s.img} alt={s.title} loading="lazy" />
              </div>
              <div className={styles.cardBody}>
                <h3 className={styles.cardTitle}>
                  <Link to={`/services/${s.slug}`}>{s.title}</Link>
                </h3>
                <p className={styles.cardText}>{s.short}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

// import React, { useState } from 'react';
// import styles from './Services.module.scss';
// import { useInView } from '../useInView';
// import { servicesData } from '../data/services';
// import { Link } from 'react-router-dom';

// export const Services: React.FC = () => {
//   const { ref, isIntersecting } = useInView<HTMLDivElement>();
//   const list = [...servicesData].sort(
//     (a, b) => (b.priority ?? 0) - (a.priority ?? 0)
//   );

//   const [activeSlug, setActiveSlug] = useState(list[0]?.slug ?? '');
//   if (!list.length) return null;

//   const active = list.find((s) => s.slug === activeSlug) ?? list[0];

//   return (
//     <section id="services" className={`section ${styles.section}`}>
//       <div
//         ref={ref}
//         className={`container reveal ${isIntersecting ? 'is-visible' : ''}`}
//       >
//         <h2 className="section-title">Программы и услуги</h2>

//         <div className={styles.layout}>
//           {/* ЛЕВАЯ КОЛОНКА — список программ/услуг */}
//           <div className={styles.list}>
//             {list.map((s) => (
//               <button
//                 key={s.slug}
//                 type="button"
//                 className={`${styles.listItem} ${
//                   s.slug === active.slug ? styles.listItemActive : ''
//                 }`}
//                 onClick={() => setActiveSlug(s.slug)}
//               >
//                 <span className={styles.listItemTitle}>{s.title}</span>
//                 {s.duration && (
//                   <span className={styles.listItemMeta}>{s.duration}</span>
//                 )}
//               </button>
//             ))}
//           </div>

//           {/* ЦЕНТР — активная услуга / программа */}
//           <article className={styles.mainCard}>
//             <div className={styles.imageWrap}>
//               <img src={active.img} alt={active.title} loading="lazy" />
//             </div>

//             <div className={styles.cardBody}>
//               <h3 className={styles.cardTitle}>{active.title}</h3>

//               {active.short && (
//                 <p className={styles.cardLead}>{active.short}</p>
//               )}

//               {active.full && (
//                 <p className={styles.cardText}>{active.full}</p>
//               )}

//               <div className={styles.metaRow}>
//                 {typeof active.priceFrom === 'number' && (
//                   <div className={styles.metaItem}>
//                     <span className={styles.metaLabel}>Стоимость от</span>
//                     <span className={styles.metaValue}>
//                       {active.priceFrom.toLocaleString('ru-RU')} ₽
//                     </span>
//                   </div>
//                 )}

//                 {active.duration && (
//                   <div className={styles.metaItem}>
//                     <span className={styles.metaLabel}>Курс</span>
//                     <span className={styles.metaValue}>{active.duration}</span>
//                   </div>
//                 )}
//               </div>

//               <Link
//                 to={`/services/${active.slug}`}
//                 className={styles.moreLink}
//               >
//                 Подробнее об услуге
//               </Link>
//             </div>
//           </article>

//           {/* ПРАВАЯ КОЛОНКА — выгоды / законы жанра */}
//           <div className={styles.benefits}>
//             {active.benefits && active.benefits.length > 0 ? (
//               active.benefits.map((b) => (
//                 <div key={b} className={styles.benefitCard}>
//                   {b}
//                 </div>
//               ))
//             ) : (
//               <div className={styles.benefitCard}>
//                 Комплексное лечение без операций и сильных препаратов
//               </div>
//             )}
//           </div>
//         </div>
//       </div>
//     </section>
//   );
// };
