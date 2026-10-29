import type { DocItem } from '@/components/DocCarousel3D/DocCarousel3D';
import { doctors } from './doctors';
import { neurologistConsultationPrices, rubleAmount } from './neurologistConsultation';

export type DoctorProfile = {
  slug: string;
  description: string;
  specialties: string[];
  introduction: string;
  biography: string[];
  qualifications: { label: string; value: string }[];
  education: { year: string; title: string; institution: string }[];
  career?: { year: string; text: string }[];
  interests: string[];
  serviceSlugs: string[];
  documents: DocItem[];
  documentNote?: string;
  accreditations?: { specialty: string; date: string; validUntil: string }[];
  publications?: { title: string; href: string; source: string }[];
  sources?: { title: string; href: string }[];
  identitySources?: string[];
  reviewsUrl?: string;
};

const tyan = doctors.find(({ id }) => id === 'tyan-viktoria')!;
const kim = doctors.find(({ id }) => id === 'kim-alina')!;

export const doctorProfiles: DoctorProfile[] = [
  {
    slug: 'tyan-viktoria',
    description: 'Тян Виктория Николаевна — главный врач Арти Клиник, невролог, доктор медицинских наук. Образование, аккредитация, стоимость приёма и запись в Москве.',
    specialties: ['Неврология', 'Рефлексотерапия', 'Мануальная терапия'],
    introduction: 'Главный врач Арти Клиник. Врач-невролог, рефлексотерапевт и мануальный терапевт, доктор медицинских наук.',
    biography: [
      'Тян Виктория Николаевна ведёт приём в Арти Клиник. Профессиональные интересы — болевые синдромы, грыжи и протрузии межпозвонковых дисков, неврологический осмотр и консервативное лечение.',
      'В работе сочетает неврологический осмотр и разбор имеющихся обследований. Дальнейшее обследование и методы лечения определяются после консультации с учётом состояния пациента.',
      'Работает профессором курса на кафедре неврологии с курсом рефлексологии и мануальной терапии РМАНПО. Учёная степень — доктор медицинских наук; учёное звание — доцент.',
    ],
    qualifications: [
      { label: 'Учёная степень', value: 'Доктор медицинских наук' },
      { label: 'Должность в РМАНПО', value: 'Профессор курса' },
      { label: 'Учёное звание', value: 'Доцент' },
      { label: 'Профессиональный опыт', value: 'Общий стаж с 1993 года; по специальности — с 2000 года, по сведениям РМАНПО.' },
    ],
    education: [
      { year: '1991', title: 'Высшее медицинское образование, педиатрия', institution: 'Донецкий государственный медицинский институт им. М. Горького.' },
      { year: '1998', title: 'Клиническая ординатура', institution: 'Российская медицинская академия последипломного образования.' },
      { year: '1998', title: 'Профессиональная переподготовка: неврология', institution: 'Факультет усовершенствования врачей МОНИКИ.' },
      { year: '2008', title: 'Профессиональная переподготовка: мануальная терапия', institution: 'Российский государственный медицинский университет Росздрава.' },
      { year: '2009', title: 'Профессиональная переподготовка: рефлексотерапия', institution: 'Российская медицинская академия последипломного образования.' },
      { year: '2025', title: 'Повышение квалификации: неврология', institution: 'Российская медицинская академия непрерывного профессионального образования.' },
      { year: '2026', title: 'Повышение квалификации: мануальная терапия', institution: 'Российская медицинская академия непрерывного профессионального образования.' },
    ],
    interests: ['Неврологический осмотр и разбор обследований', 'Болевые синдромы спины и шеи', 'Грыжи и протрузии межпозвонковых дисков', 'Мануальная терапия и рефлексотерапия'],
    serviceSlugs: ['nevrolog', 'manual-therapy', 'reflexotherapy', 'programma-lecheniya-gryzhi-v-moskve'],
    // The two new accreditation extracts use copies without personal numbers.
    documents: tyan.docs,
    accreditations: [
      { specialty: 'Неврология', date: '27.01.2026', validUntil: '27.01.2031' },
      { specialty: 'Рефлексотерапия', date: '24.03.2026', validUntil: '24.03.2031' },
      { specialty: 'Мануальная терапия', date: '27.06.2023', validUntil: '27.06.2028' },
    ],
    sources: [{ title: 'Профиль Тян Виктории Николаевны на сайте РМАНПО', href: 'https://rmanpo.ru/sveden/struct/employee/tyan-viktoriya-nikolaevna-0001644/' }],
    identitySources: ['https://rmanpo.ru/sveden/struct/employee/tyan-viktoriya-nikolaevna-0001644/'],
    publications: [{
      title: 'Влияние нейрорефлекторных методов на вегетативное обеспечение шейного региона',
      href: 'https://mosmanter.ru/%D0%91%D1%8E%D0%BB%D0%BB%D0%B5%D1%82%D0%B5%D0%BD%D1%8C%202023.pdf#page=19',
      source: 'Тян В. Н., Александров В. И. Бюллетень Российской ассоциации мануальной медицины, 2023, с. 19.',
    }],
  },
  {
    slug: 'kim-alina',
    description: 'Ким Алина Александровна — врач-невролог Арти Клиник в Москве у метро Парк Победы. Направления работы, стоимость консультации и запись на приём.',
    specialties: ['Неврология', 'Реабилитация'],
    introduction: 'Врач-невролог Арти Клиник. Работает с болью в спине и шее, онемением, прострелами и туннельными синдромами.',
    biography: [
      'Ким Алина Александровна ведёт неврологический приём в Арти Клиник. Консультирует пациентов с болью в шее и пояснице, онемением, прострелами и жалобами, связанными с туннельными синдромами.',
      'На консультации оценивает чувствительность, мышечную силу и рефлексы, обсуждает жалобы и имеющиеся результаты обследований. По итогам осмотра предлагает дальнейший план обследования и лечения.',
      'В профессиональных интересах — реабилитация, рекомендации по упражнениям и режиму нагрузки с учётом повседневных задач пациента.',
    ],
    qualifications: [],
    // Education also matches the clinic's published biography and Yandex's
    // doctor profile. Experience still needs confirmation.
    education: [
      { year: '2018', title: 'Высшее медицинское образование: лечебное дело', institution: 'Первый Московский государственный медицинский университет им. И. М. Сеченова.' },
      { year: '2020', title: 'Клиническая ординатура: неврология', institution: 'Центральная государственная медицинская академия Управления делами Президента РФ.' },
      { year: '2020', title: 'Профессиональная переподготовка: мануальная терапия', institution: 'Российский национальный исследовательский медицинский университет им. Н. И. Пирогова.' },
      { year: '2021', title: 'Профессиональная переподготовка: рефлексотерапия', institution: 'Российская медицинская академия непрерывного профессионального образования.' },
    ],
    documents: kim.docs,
    documentNote: 'Документы об образовании выданы на девичью фамилию — Тян.',
    interests: ['Боль в шее и пояснице', 'Онемение и прострелы', 'Туннельные синдромы', 'Реабилитация и подбор нагрузки'],
    serviceSlugs: ['nevrolog', 'programma-kompleksnoe-lechenie-bolevogo-sindroma-v-moskve'],
    publications: [{
      title: 'Мультидисциплинарные программы в лечении хронической неспецифической боли в спине',
      href: 'https://mosmanter.ru/%D0%91%D1%8E%D0%BB%D0%BB%D0%B5%D1%82%D0%B5%D0%BD%D1%8C%202023.pdf#page=17',
      source: 'Ким А. А., Данилов Ал. Б. Бюллетень Российской ассоциации мануальной медицины, 2023, с. 17–18.',
    }],
    reviewsUrl: 'https://yandex.ru/medicine/doctor/kim_alina_LuDpCQFf0vKGt',
    identitySources: ['https://yandex.ru/medicine/doctor/kim_alina_LuDpCQFf0vKGt', 'https://alinakim.site/'],
    sources: [
      { title: 'Профиль Ким Алины Александровны в Яндекс Медицине', href: 'https://yandex.ru/medicine/doctor/kim_alina_LuDpCQFf0vKGt' },
      { title: 'Персональный сайт Ким Алины Александровны', href: 'https://alinakim.site/' },
    ],
    career: [{ year: '2023', text: 'В научной публикации о лечении хронической неспецифической боли в спине указана как аспирант кафедры нервных болезней ИПО Сеченовского университета. Сведения относятся к моменту публикации.' }],
  },
];

export function getDoctorProfile(slug: string | undefined) {
  const profile = doctorProfiles.find((item) => item.slug === slug);
  const doctor = doctors.find(({ id }) => id === slug);
  return profile && doctor ? { ...profile, doctor } : undefined;
}

export function doctorConsultationPrices(profile: DoctorProfile) {
  return neurologistConsultationPrices.filter(({ neurologyConsultation }) =>
    profile.slug === 'tyan-viktoria'
      ? neurologyConsultation.doctorId === profile.slug
      : !neurologyConsultation.doctorId);
}

export function doctorConsultationMinimum(profile: DoctorProfile) {
  return doctorConsultationPrices(profile)
    .filter(({ neurologyConsultation }) => neurologyConsultation.visit !== 'repeat')
    .map(({ price }) => rubleAmount(price))
    .filter((amount): amount is number => amount !== null)
    .sort((a, b) => a - b)[0];
}
