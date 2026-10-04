import SeoAuto from '@/components/SeoAuto';
import { CLINIC_SHARE_IMAGE } from '@/data/clinic';

export default function NotFound() {
  return (
    <>
      <SeoAuto
        title="Страница не найдена — Arti Clinic"
        description="К сожалению, такой страницы нет."
        robots="noindex, nofollow"
        images={CLINIC_SHARE_IMAGE}
      />
      <div className="container" style={{ padding: '60px 0' }}>
        <h1>404 — Страница не найдена</h1>
        <p>
          Проверьте адрес или вернитесь на <a href="/">главную</a>.
        </p>
      </div>
    </>
  );
}
