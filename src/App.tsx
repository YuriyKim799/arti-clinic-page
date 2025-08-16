import React from 'react';
import styles from './styles/App.module.scss';
import { Routes, Route } from 'react-router-dom';
import { Hero } from './components/Hero';
import { Benefits } from './components/Benefits';
import { Services } from './components/Services';
import { Blog } from './components/Blog';
import { Contact } from './components/Contact';
import { Footer } from './components/Footer';
import { NavBar } from './components/NavBar';
import { ServicesIndex } from './pages/ServicesIndex';
import { ServiceDetail } from './pages/ServiceDetail';
import { Indications } from './components/Indications';
import { Marquee } from './components/Marquee';
import { YandexReviewsFloating } from './components/YandexReviewsFloating';
import SectionGallery from './components/SectionGallery';

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
      compact // ниже по высоте
      showSideInfo
      rating={5.0}
      reviewsCount={33}
    />
    <Blog />
    <Contact />
    <Footer />
  </>
);

const App: React.FC = () => {
  return (
    <div className={styles.app}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/services" element={<ServicesIndex />} />
        <Route path="/services/:slug" element={<ServiceDetail />} />
        <Route path="*" element={<Home />} />
      </Routes>
    </div>
  );
};

export default App;
