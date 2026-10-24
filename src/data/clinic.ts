export const SITE_ORIGIN = (
  import.meta.env.VITE_SITE_URL || 'https://articlinic.ru'
).replace(/\/+$/, '');

export const CLINIC_ID = `${SITE_ORIGIN}/#clinic`;

const clinicSchedule = [
  { days: 'Mo-Sa', label: 'Пн–Сб', opens: '09:00', closes: '20:00' },
  { days: 'Su', label: 'Вс', opens: '10:00', closes: '18:00' },
];
export const CLINIC_SCHEDULE_TEXT = clinicSchedule
  .map(({ label, opens, closes }) => `${label} ${opens}–${closes}`).join(' · ');

export const CLINIC_SHARE_IMAGE = {
  url: '/images/clinic-share.jpg',
  width: 1200,
  height: 800,
  alt: 'Вход в Арти Клиник на улице 1812 года в Москве',
  type: 'image/jpeg' as const,
};

// These details match the address, phones and schedule displayed in Contacts.
export const clinicJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'MedicalClinic',
  '@id': CLINIC_ID,
  name: 'Арти Клиник',
  legalName: 'ООО «Энергия жизни»',
  url: `${SITE_ORIGIN}/`,
  telephone: ['+7 499 148-17-24', '+7 999 831-06-36'],
  email: 'articlinicmoscow@gmail.com',
  address: {
    '@type': 'PostalAddress',
    postalCode: '121293',
    addressCountry: 'RU',
    addressLocality: 'Москва',
    streetAddress: 'ул. 1812 года, д. 3, помещение 5/1',
  },
  medicalSpecialty: 'https://schema.org/Neurologic',
  openingHours: clinicSchedule.map(({ days, opens, closes }) => `${days} ${opens}-${closes}`),
  sameAs: ['https://t.me/Artiklinic', 'https://yandex.ru/maps/org/19149709238'],
  image: `${SITE_ORIGIN}${CLINIC_SHARE_IMAGE.url}`,
  logo: `${SITE_ORIGIN}/images/clinic-logo.png`,
};
