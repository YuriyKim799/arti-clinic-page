import React, { Suspense } from 'react';
import styles from './styles/App.module.scss';
import { Routes, Route } from 'react-router-dom';
import { ServicesIndex } from './pages/ServicesIndex';
import { ServiceDetail } from './pages/ServiceDetail';
import ScrollToTop from '@/components/ScrollToTop';
import AgreementPage from '@/pages/AgreementPage/AgreementPage';
import PoliticPage from '@/pages/PoliticPage/PoliticPage';
import { Home } from '@/components/Home/Home';
import NotFound from '@/pages/NotFound';

const BlogIndex = React.lazy(() => import('@/pages/BlogIndex'));
const BlogPost = React.lazy(() => import('@/pages/BlogPost'));

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
          <Route path="*" element={<NotFound />} />
          <Route path="/agreement" element={<AgreementPage />} />
          <Route path="/politic" element={<PoliticPage />} />
        </Routes>
      </Suspense>
    </div>
  );
};

export default App;
