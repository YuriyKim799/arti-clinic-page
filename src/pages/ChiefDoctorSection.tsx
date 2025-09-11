import DocCarousel3D, {
  DocItem,
} from '@/components/DocCarousel3D/DocCarousel3D';
import React, { useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import styles from '@/pages/ChiefDoctorSection.module.scss';
import RecordButton from '@/components/RecordButton/RecordButton';
import TelegramButton from '@/components/TelegramButton/TelegramButton';
import DocSliderFade from '@/components/DocSliderFade/DocSliderFade';

type Fact = { label: string; value: string; hint?: string };

export type ChiefDoctorSectionProps = {
  id?: string;
  name: string;
  position?: string; // "Главный врач"
  primarySpecialty?: string; // "Невролог"
  about: React.ReactNode; // React-контент с разметкой
  photo: {
    src: string;
    alt?: string;
    // опционально — для ретины/вебп
    webp2x?: string;
    webp1x?: string;
    jpg2x?: string;
    jpg1x?: string;
  };
  docs: DocItem[];
  facts?: Fact[];
  cta?: {
    primaryHref?: string;
    primaryLabel?: string; // "Записаться"
    secondaryHref?: string;
    secondaryLabel?: string; // "Задать вопрос"
  };
  // ширины карточек слайдера под твой компонент
  panelWidth?: number;
  panelHeight?: number;
  className?: string;
};

function useIsNarrow(max = 1249) {
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

export default function ChiefDoctorSection({
  id = 'chief-doctor',
  name,
  position = 'Главный врач',
  primarySpecialty,
  about,
  photo,
  docs,
  facts = [
    { label: 'Опыт', value: '30+ лет' },
    { label: 'Пациентов/год', value: '1200+' },
    { label: 'Профиль', value: primarySpecialty || 'Главный - врач' },
  ],
  cta = {
    primaryHref: '#record',
    primaryLabel: 'Записаться',
    secondaryHref: '#contact',
    secondaryLabel: 'Задать вопрос',
  },
  panelWidth = 420,
  panelHeight = 452,
  className,
}: ChiefDoctorSectionProps) {
  const hasDocs = docs && docs.length > 0;
  const isNarrow = useIsNarrow(1249);
  // Незаметный анти-шейк: ограничим количество фактов до 4 для эстетики
  const safeFacts = useMemo(() => facts.slice(0, 4), [facts]);

  return (
    <section id={id} className={clsx(styles.section, className)}>
      <div className={styles.container}>
        {/* Левая колонка: фото + факты + CTA (на десктопе — «приклеено») */}
        <aside className={styles.left}>
          <figure className={styles.photoCard}>
            <picture>
              {photo.webp2x && (
                <source
                  srcSet={`${photo.webp1x || photo.webp2x} 1x, ${
                    photo.webp2x
                  } 2x`}
                  type="image/webp"
                />
              )}
              {(photo.jpg2x || photo.jpg1x) && (
                <source
                  srcSet={`${photo.jpg1x || photo.jpg2x} 1x, ${
                    photo.jpg2x || photo.jpg1x
                  } 2x`}
                  type="image/jpeg"
                />
              )}
              <img
                loading="lazy"
                decoding="async"
                src={photo.src}
                alt={photo.alt || name}
                className={styles.photo}
              />
            </picture>
            <figcaption className={styles.caption}>
              <span className={styles.position}>{position}</span>
              <span className={styles.name}>{name}</span>
              {primarySpecialty && (
                <span className={styles.specialty}>{primarySpecialty}</span>
              )}
            </figcaption>
            <div className={styles.glow} aria-hidden="true" />
          </figure>

          {safeFacts.length > 0 && (
            <ul className={styles.facts} role="list">
              {safeFacts.map((f, i) => (
                <li key={i} className={styles.factItem}>
                  <span className={styles.factValue}>{f.value}</span>
                  <span className={styles.factLabel}>
                    {f.label}
                    {f.hint && <em className={styles.factHint}> · {f.hint}</em>}
                  </span>
                </li>
              ))}
            </ul>
          )}

          <div className={styles.ctaRow}>
            {cta.primaryHref && (
              <RecordButton variant="primary">Записаться</RecordButton>
            )}
            {cta.secondaryHref && (
              <TelegramButton to="@Artiklinic" variant="primary" />
            )}
          </div>
        </aside>

        {/* Правая колонка: описание + документы */}
        <div className={styles.right}>
          <div className={styles.aboutCard}>
            {/* микро-заголовок */}
            <div className={styles.kicker}>
              Экспертный подход · Персональная терапия
            </div>
            <h2 className={styles.h2}>
              Забота, основанная на доказательной медицине
            </h2>
            <div className={styles.aboutText}>{about}</div>

            {/* Аккуратная «золочёная» цитата для брендинга */}
            <blockquote className={styles.quote}>
              <span className={styles.quoteMark} aria-hidden="true">
                “
              </span>
              <p>
                Мы лечим не диагноз, а человека с его целями, ритмом жизни и
                будущими планами. Результат — это когда пациент возвращается к
                любимым делам без боли.
              </p>
              <span className={styles.quoteMark} aria-hidden="true">
                ”
              </span>
            </blockquote>
          </div>

          {hasDocs && (
            <div className={styles.docsCard}>
              <div className={styles.docsHeader}>
                <h3 className={styles.h3}>Документы и сертификаты</h3>
                <p className={styles.subtle}>
                  Подтверждение квалификации и повышения квалификации.
                </p>
              </div>

              {/* Во избежание SSR-рассинхронизации — пока не знаем ширину, рендерим placeholder */}
              {isNarrow === null ? (
                <div
                  style={{
                    height: panelHeight,
                    borderRadius: 20,
                    background: 'rgba(0,0,0,0.03)',
                  }}
                />
              ) : isNarrow ? (
                <DocSliderFade
                  items={docs}
                  panelWidth={Math.min(360, panelWidth)}
                  panelHeight={Math.min(420, panelHeight)}
                  intervalMs={4200}
                />
              ) : (
                <DocCarousel3D
                  items={docs}
                  panelWidth={panelWidth}
                  panelHeight={panelHeight}
                />
              )}

              <p className={styles.hint}>
                Листайте документы. Клик — открыть деталь.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
