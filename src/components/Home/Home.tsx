import { lazy, Suspense } from 'react';
const BlogSection = lazy(() => import('@/components/BlogSection'));
const SectionGallery = lazy(() => import('@/components/SectionGallery'));
const Indications = lazy(() =>
  import('@/components/Indications').then((m) => ({ default: m.Indications }))
);
const Marquee = lazy(() => import('@/components/Marquee'));
const YandexReviewsFloating = lazy(() =>
  import('@/components/YandexReviewsFloating').then((m) => ({
    default: m.YandexReviewsFloating,
  }))
);
const Hero = lazy(() =>
  import('@/components/Hero').then((m) => ({ default: m.Hero }))
);
const Benefits = lazy(() =>
  import('@/components/Benefits').then((m) => ({ default: m.Benefits }))
);
const Services = lazy(() =>
  import('@/components/Services').then((m) => ({ default: m.Services }))
);
const Contact = lazy(() =>
  import('@/components/Contact').then((m) => ({ default: m.Contact }))
);
const Footer = lazy(() =>
  import('@/components/Footer').then((m) => ({ default: m.Footer }))
);
import { NavBar } from '@/components/NavBar';
import SeoAuto from '@/components/SeoAuto';

export const Home = () => (
  <>
    {/* SEO для главной */}
    <SeoAuto
      title="Лечение болей в спине и грыж без операции — Arti Clinic, Москва"
      description="Диагностика и лечение межпозвонковых грыж, рефлексотерапия, ЛФК, мануальная терапия. Адрес: Москва, ул. 1812 года, д.3."
      image="https://articlinic.ru/og-default.jpg"
      jsonLd={[
        {
          '@context': 'https://schema.org',
          '@type': 'MedicalClinic',
          name: 'Арти Клиник — ООО «Энергия жизни»',
          url: 'https://articlinic.ru/',
          telephone: '+7 999 831-06-36',
          email: 'articlinicmoscow@gmail.com',
          address: {
            '@type': 'PostalAddress',
            postalCode: '121293',
            addressCountry: 'RU',
            addressLocality: 'Москва',
            streetAddress: 'ул. 1812 года, д.3, помещение 5/1',
          },
          medicalSpecialty: [
            'Мануальная терапия',
            'Ударно-волновая терапия',
            'Рефлексотерапия',
            'Фармакопунктура',
            'Лечебный массаж',
            'Кинезиотейпирование',
            'Неврология',
          ],
          openingHours: 'Mo-Su 09:00-20:00',
          sameAs: [
            'https://t.me/Artiklinic',
            'https://yandex.ru/maps/org/19149709238',
          ],
          image: 'https://articlinic.ru/og-default.jpg',
        },
        {
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          url: 'https://articlinic.ru/',
          name: 'Арти Клиник',
          potentialAction: {
            '@type': 'SearchAction',
            target: 'https://articlinic.ru/search?q={search_term_string}',
            'query-input': 'required name=search_term_string',
          },
        },
      ]}
    />

    <NavBar />
    <Suspense fallback={null}>
      <Hero />
      <Benefits />
      <Services />
      <Indications />
      <Marquee />
      <SectionGallery />
      <YandexReviewsFloating
        orgId="19149709238"
        compact
        showSideInfo
        rating={5.0}
        reviewsCount={33}
      />
      <BlogSection />
      <Contact />
      <Footer />
    </Suspense>
  </>
);
