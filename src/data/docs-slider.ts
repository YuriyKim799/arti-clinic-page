import type { DocItem } from '@/components/DocCarousel3D/DocCarousel3D';

import sertNevr from '@/assets/tyanSertNevr.jpg';
import sertRef from '@/assets/tyanSertReflexo.jpg';
import sertManual from '@/assets/tyanManual.jpg';
import vipyska from '@/assets/vipyska.png';
import diplomManual from '@/assets/diplom-manual.jpg';
import diplomRef from '@/assets/diplom-ref.jpg';
import diplomNevr from '@/assets/diplom-nevr.jpg';
import kimDoc1 from '@/assets/kimVrach.jpg';
import kimDoc2 from '@/assets/kimNevrol.jpg';
import kimDoc3 from '@/assets/kimreflexo.jpg';
import kimDoc4 from '@/assets/kimManual.jpg';

export const tyanDocs: DocItem[] = [
  { src: sertNevr },
  { src: sertRef },
  { src: sertManual },
  { src: vipyska },
  { src: diplomManual },
  { src: diplomRef },
  { src: diplomNevr },
];

export const kimDocs: DocItem[] = [
  { src: kimDoc1 },
  { src: kimDoc2 },
  { src: kimDoc3 },
  { src: kimDoc4 }
];

export const docs = tyanDocs;
