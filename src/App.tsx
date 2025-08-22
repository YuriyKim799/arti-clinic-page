import React, { Suspense } from 'react';
import styles from './styles/App.module.scss';
import { Routes, Route } from 'react-router-dom';
import { Hero } from './components/Hero';
import { Benefits } from './components/Benefits';
import { Services } from './components/Services';
import { Contact } from './components/Contact';
import { Footer } from './components/Footer';
import { NavBar } from './components/NavBar';
import { ServicesIndex } from './pages/ServicesIndex';
import { ServiceDetail } from './pages/ServiceDetail';
import { Indications } from './components/Indications';
import { Marquee } from './components/Marquee';
import { YandexReviewsFloating } from './components/YandexReviewsFloating';
import SectionGallery from './components/SectionGallery';
import ScrollToTop from '@/components/ScrollToTop';
import BlogSection from '@/components/BlogSection';
import AgreementPage from '@/pages/AgreementPage/AgreementPage';
import PoliticPage from '@/pages/PoliticPage/PoliticPage';

const BlogIndex = React.lazy(() => import('@/pages/BlogIndex'));
const BlogPost = React.lazy(() => import('@/pages/BlogPost'));

const Home = () => (
  <>
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

const App: React.FC = () => {
  return (
    <div className={styles.app}>
      <ScrollToTop />
      <Suspense fallback={<div className={styles.pageLoader}>Загружаем…</div>}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/services" element={<ServicesIndex />} />
          <Route path="/services/:slug" element={<ServiceDetail />} />
          <Route path="/blog" element={<BlogIndex />} />
          <Route path="/blog/:slug" element={<BlogPost />} />
          <Route path="*" element={<Home />} />
          <Route path="/agreement" element={<AgreementPage />} />
          <Route path="/politic" element={<PoliticPage />} />
        </Routes>
      </Suspense>
    </div>
  );
};

export default App;
