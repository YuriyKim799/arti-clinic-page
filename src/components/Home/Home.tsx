import BlogSection from '@/components/BlogSection';
import SectionGallery from '@/components/SectionGallery';
import { Indications } from '@/components/Indications';
import { Marquee } from '@/components/Marquee';
import { YandexReviewsFloating } from '@/components/YandexReviewsFloating';
import { Hero } from '@/components/Hero';
import { Benefits } from '@/components/Benefits';
import { Services } from '@/components/Services';
import { Contact } from '@/components/Contact';
import { Footer } from '@/components/Footer';
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
  </>
);
