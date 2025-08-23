import SeoAuto from '@/components/SeoAuto';

export default function NotFound() {
  return (
    <>
      <SeoAuto
        title="Страница не найдена — Arti Clinic"
        description="К сожалению, такой страницы нет."
        // meta robots "noindex" только здесь:
        jsonLd={{}} // пустой объект, чтобы не ругался тип
      />
      {/* простой блок 404 */}
      <div className="container" style={{ padding: '60px 0' }}>
        <h1>404 — Страница не найдена</h1>
        <p>
          Проверьте адрес или вернитесь на <a href="/">главную</a>.
        </p>
      </div>
    </>
  );
}
