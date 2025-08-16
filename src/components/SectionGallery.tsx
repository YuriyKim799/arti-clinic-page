import PremiumCarouselFade from './PremiumCarouselFade/PremiumCarouselFade';
import { clinicSlides } from '../data/slides';

export default function SectionGallery() {
  return (
    <section className="section">
      <div className="container">
        <h2 className="section-title">Фото нашего центра</h2>
        <PremiumCarouselFade
          slides={clinicSlides}
          autoPlay
          autoPlayDelayMs={4500}
          transitionMs={700}
          aspectRatio="16 / 9"
        />
      </div>
    </section>
  );
}
