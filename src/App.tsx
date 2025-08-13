import React from 'react';
import styles from './styles/App.module.scss';
import { Routes, Route } from 'react-router-dom';
import { Hero } from './components/Hero';
import { Benefits } from './components/Benefits';
import { Services } from './components/Services';
import { Reviews } from './components/Reviews';
import { Blog } from './components/Blog';
import { Contact } from './components/Contact';
import { Footer } from './components/Footer';
import { NavBar } from './components/NavBar';
import { ServicesIndex } from './pages/ServicesIndex';
import { ServiceDetail } from './pages/ServiceDetail';
import { Indications } from './components/Indications';
import { Marquee } from './components/Marquee';
import { YandexBottomSheet } from './components/YandexBottomSheet';

const Home = () => (
  <>
    <NavBar />
    <Hero />
    <Benefits />
    <Services />
    <Indications />
    <Marquee />
    <YandexBottomSheet
      orgId="19149709238"
      rating={4.9}
      count={132}
      showComments
    />
    <Reviews />
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
