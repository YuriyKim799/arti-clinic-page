import React, { Suspense, useState } from 'react';
import styles from './styles/App.module.scss';
import { Routes, Route } from 'react-router-dom';
import { ServicesIndex } from './pages/ServicesIndex';
import { ServiceDetail } from './pages/ServiceDetail';
import ScrollToTop from '@/components/ScrollToTop';
import AgreementPage from '@/pages/AgreementPage/AgreementPage';
import PoliticPage from '@/pages/PoliticPage/PoliticPage';
import { Home } from '@/components/Home/Home';
import NotFound from '@/pages/NotFound';
import ArtiWordLoader from '@/components/ArtiWordLoader/ArtiWordLoader';
import PriceListPage from '@/pages/PriceListPage/PriceListPage';
const BlogIndex = React.lazy(() => import('@/pages/BlogIndex'));
const BlogPost = React.lazy(() => import('@/pages/BlogPost'));

const App: React.FC = () => {
  const [ready, setReady] = useState(false);

  return (
    <>
      {!ready && (
        <ArtiWordLoader stepMs={140} autoHide onDone={() => setReady(true)} />
      )}

      <div className={styles.app}>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/services" element={<ServicesIndex />} />
          <Route path="/services/:slug" element={<ServiceDetail />} />
          <Route path="/blog" element={<BlogIndex />} />
          <Route path="/blog/:slug" element={<BlogPost />} />
          <Route path="*" element={<NotFound />} />
          <Route path="/agreement" element={<AgreementPage />} />
          <Route path="/politic" element={<PoliticPage />} />
          <Route path="/price-list" element={<PriceListPage />} />
        </Routes>
      </div>
    </>
  );
};

export default App;
