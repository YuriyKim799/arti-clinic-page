import React, { lazy, Suspense } from 'react';
import { NavBar } from '@/components/NavBar';
import SeoAuto from '@/components/SeoAuto';
import { CLINIC_SHARE_IMAGE, SITE_ORIGIN, clinicJsonLd } from '@/data/clinic';

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
const PainStatement = lazy(() =>
  import('@/components/PainStatement').then((m) => ({ default: m.PainStatement }))
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

const ChiefDoctorSection = lazy(() => import('@/pages/ChiefDoctorSection'));
const NeurologistFeature = lazy(() => import('@/components/NeurologistFeature'));

// ✅ врачи теперь в data
import { doctors } from '@/data/doctors';

export const Home = () => (
  <>
    <SeoAuto
      title="Лечение грыжи позвоночника и боли в спине в Москве — Арти Клиник"
      description="Консультации невролога, лечение межпозвонковых грыж и боли в спине, мануальная терапия и рефлексотерапия. Москва, ул. 1812 года, д. 3. Запись на приём."
      images={CLINIC_SHARE_IMAGE}
      locale="ru_RU"
      twitterCard="summary_large_image"
      jsonLd={[
        clinicJsonLd,
        {
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          url: `${SITE_ORIGIN}/`,
          name: 'Арти Клиник',
        },
      ]}
    />

    <NavBar />

    <Suspense fallback={null}>
      <Hero />
      <PainStatement />
      <Benefits />
      <Services />
     <NeurologistFeature />

      <ChiefDoctorSection
        title="Специалисты Арти Клиник"
        doctors={doctors}
      />
   
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
