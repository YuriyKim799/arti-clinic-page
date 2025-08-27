import SeoAuto from '@/components/SeoAuto';

export default function NotFound() {
  const site = import.meta.env.VITE_SITE_URL || 'https://articlinic.ru';
  return (
    <>
      <SeoAuto
        title="Страница не найдена — Arti Clinic"
        description="К сожалению, такой страницы нет."
        robots="noindex, nofollow"
        images={{
          url: `${site}/og/404-1200x630.jpg`,
          width: 1200,
          height: 630,
          alt: '404 — не найдено',
          type: 'image/jpeg',
        }}
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
