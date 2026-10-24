import type { DocItem } from '@/components/DocCarousel3D/DocCarousel3D';

import sertNevr from '@/assets/tyan-neurology-accreditation-public.webp';
import sertRef from '@/assets/tyan-reflexotherapy-accreditation-public.webp';
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
  { src: sertNevr, label: 'Выписка об аккредитации по неврологии, 2026', alt: 'Тян Виктория Николаевна — выписка об аккредитации по неврологии от 03.02.2026' },
  { src: sertRef, label: 'Выписка об аккредитации по рефлексотерапии, 2026', alt: 'Тян Виктория Николаевна — выписка об аккредитации по рефлексотерапии от 27.03.2026' },
  { src: sertManual, label: 'Аккредитация по мануальной терапии, 2023 — фрагмент выписки', alt: 'Тян Виктория Николаевна — фрагмент выписки о мануальной терапии, аккредитация 27.06.2023' },
  { src: vipyska, label: 'Выписка об аккредитации по мануальной терапии, 2023', alt: 'Тян Виктория Николаевна — выписка об аккредитации по мануальной терапии от 30.06.2023' },
  { src: diplomManual, label: 'Диплом: мануальная терапия, 2008', alt: 'Тян Виктория Николаевна — диплом о переподготовке по мануальной терапии, 2008' },
  { src: diplomRef, label: 'Диплом: рефлексотерапия, 2009', alt: 'Тян Виктория Николаевна — диплом о переподготовке по рефлексотерапии, 2009' },
  { src: diplomNevr, label: 'Диплом: неврология, 1998', alt: 'Тян Виктория Николаевна — диплом о переподготовке по неврологии, 1998' },
];

export const kimDocs: DocItem[] = [
  { src: kimDoc1, label: 'Диплом: лечебное дело, 2018', alt: 'Диплом о высшем медицинском образовании, лечебное дело, 2018' },
  { src: kimDoc2, label: 'Диплом об ординатуре: неврология, 2020', alt: 'Диплом об окончании ординатуры по неврологии, 2020' },
  { src: kimDoc3, label: 'Диплом: рефлексотерапия, 2021', alt: 'Диплом о переподготовке по рефлексотерапии, 2021' },
  { src: kimDoc4, label: 'Диплом: мануальная терапия, 2020', alt: 'Диплом о переподготовке по мануальной терапии, 2020' }
];

export const docs = tyanDocs;
