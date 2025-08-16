import reception from '../assets/1.png';
import mainEnter from '../assets/2.png';
import loby from '../assets/3.png';
import loby2 from '../assets/4.png';
import room1 from '../assets/5.png';
import roomDesc1 from '../assets/6.png';
import roomDesc2 from '../assets/7.png';
import room2 from '../assets/8.png';
import type { Slide } from '../components/PremiumCarouselFade/PremiumCarouselFade';

export const clinicSlides: Slide[] = [
  {
    src: mainEnter,
    alt: 'Главный вход Арти Клиник',
    caption: 'Главный вход',
  },
  {
    src: reception,
    alt: 'Ресепшен Арти Клиник',
    caption: 'Ресепшен',
  },
  {
    src: loby,
    alt: 'Лобби Арти Клиник',
    caption: 'Лобби',
  },
  {
    src: loby2,
    alt: 'Лобби Арти Клиник',
    caption: 'Коридор',
  },
  {
    src: room1,
    alt: 'Кабинет Арти Клиник',
    caption: 'Кабинет врача',
  },
  {
    src: roomDesc1,
    alt: 'Кабинет Арти Клиник',
    caption: 'Кабинет и оборудование',
  },
  {
    src: roomDesc2,
    alt: 'Кабинет врача Арти Клиник',
    caption: 'Кабинет и оборудование',
  },
  {
    src: room2,
    alt: 'Кабинет врача Арти Клиник',
    caption: 'Кабинет и оборудование',
  },
];
