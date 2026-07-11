import type { Doctor } from '@/pages/ChiefDoctorSection';
import { kimDocs, tyanDocs } from '@/data/docs-slider';
import chiefDocImage from '@/assets/chief-doc.jpg';
import kimAAphoto from '@/assets/kimAAnevr.jpg';
import { chiefDoctorMoreInfo } from '@/data/chiefDoctorMoreInfo';

export const doctors: Doctor[] = [
  {
    id: 'tyan-viktoria',
    name: 'Тян Виктория Николаевна',
    position: 'Главный врач',
    primarySpecialty: 'Неврология · Мануальная терапия · Рефлексотерапия',

    bio: (
      <>
        <p>
          Врач-невролог, мануальный терапевт, рефлексотерапевт, специализация — болевые синдромы, грыжи и протрузии,
          лечение без операций.
        </p>
        <p>
          Комбинирует неврологию, мануальные техники и рефлексотерапию, чтобы
          быстро снять боль и вернуть движение.
        </p>
      </>
    ),

    featureCards: [
      {
        title: 'Точная диагностика — основа результата',
        text: (
          <p>
            Неврологический осмотр + разбор МРТ/КТ. Лечим причину, а не
            “замазываем” симптомы.
          </p>
        ),
      },
      {
        title: 'Лечение: точечно и поэтапно',
        text: (
          <p>
            Строим план под ваш механизм боли: мягкие мануальные техники,
            рефлексотерапия и реабилитация. Цель — не «обезболить на время», а
            восстановить движение и устойчивость к нагрузке.
          </p>
        ),
      },
      {
        title: 'Комплексное лечение с понятной целью',
        text: (
          <p>
            Снижаем боль, улучшаем движение, работаем с рецидивами и
            поддержанием результата.
          </p>
        ),
      },
    ],

    moreInfoTitle: 'О главном и ведущем враче Арти Клиник',
    moreInfo: chiefDoctorMoreInfo,

    photo: {
      src: chiefDocImage,
      alt: 'Доктор Тян Виктория Николаевна',
      webp2x: chiefDocImage,
      webp1x: chiefDocImage,
      jpg2x: chiefDocImage,
      jpg1x: chiefDocImage,
    },

    docs: tyanDocs,
    experience: '30+ лет',
    // rating: 5.0,
    // reviewsCount: 33,

    facts: [
      { label: 'Приём', value: 'Обязательный осмотр' },
      { label: 'Подход', value: 'Без операции' },
      { label: 'Фокус', value: 'Боль/грыжи' },
    ],
  },

  {
    id: 'kim-alina',
    name: 'Ким Алина Александровна',
    position: 'Врач-невролог',
    primarySpecialty: 'Неврология · Реабилитация',

    bio: (
      <>
        <p>
          Работает с болью в шее и пояснице, онемением, прострелами, туннельными
          синдромами.
        </p>
        <p>
          Делает понятный план лечения и домашней стабилизации, чтобы результат
          держался.
        </p>
      </>
    ),

    featureCards: [
      {
        title: 'Акцент на неврологию',
        text: (
          <p>
            Оцениваем нерв: чувствительность, сила, рефлексы — чтобы не
            пропустить компрессию/невропатию.
          </p>
        ),
      },
      {
        title: 'План на дом',
        text: (
          <p>
            Упражнения и режим нагрузки, под твой день — чтобы эффект не
            “сдувался” через неделю.
          </p>
        ),
      },
      {
        title: 'Бережный стиль',
        text: (
          <p>
            Без агрессивных манипуляций: мягко, безопасно, с контролем динамики.
          </p>
        ),
      },
    ],

    moreInfoTitle: 'Подробнее о специалисте',
    moreInfo: chiefDoctorMoreInfo, // потом заменишь на kimMoreInfo

    photo: {
      src: kimAAphoto, 
      alt: 'Доктор Ким Алина Александровна',
      webp2x: kimAAphoto,
      webp1x: kimAAphoto,
      jpg2x: kimAAphoto,
      jpg1x: kimAAphoto,
    },

    docs: kimDocs, // если документов нет — поставь []
    experience: '10 лет',
    // rating: 5.0,
    // reviewsCount: 12,

    facts: [
      // { label: 'Фокус', value: 'Невропатии' },
      // { label: 'Подход', value: 'Доказательный' },
      // { label: 'Курс', value: '6–10' },
    ],
  },
];
