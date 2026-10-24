import { PRICE_CATEGORIES, type PriceItem } from './priceList';

export type ConsultationPrice = PriceItem & {
  neurologyConsultation: NonNullable<PriceItem['neurologyConsultation']>;
};

// Select the same entries used by the full price list; never duplicate amounts.
export const neurologistConsultationPrices = PRICE_CATEGORIES
  .flatMap(({ items }) => items)
  .filter((item): item is ConsultationPrice => !!item.neurologyConsultation)
  .sort((a, b) => {
    const doctor = Number(!!a.neurologyConsultation.doctorId) - Number(!!b.neurologyConsultation.doctorId);
    const repeat = Number(a.neurologyConsultation.visit === 'repeat') - Number(b.neurologyConsultation.visit === 'repeat');
    return doctor || repeat || (a.neurologyConsultation.durationMinutes ?? 0) - (b.neurologyConsultation.durationMinutes ?? 0);
  });

export function consultationLabel(item: ConsultationPrice): string {
  if (item.neurologyConsultation.doctorId) {
    return item.neurologyConsultation.visit === 'repeat'
      ? 'Повторная консультация главного врача'
      : 'Консультация главного врача';
  }
  return item.neurologyConsultation.visit === 'repeat'
    ? 'Повторный приём врача-невролога'
    : 'Первичный приём врача-невролога';
}

export function rubleAmount(price: string): number | null {
  const amount = Number(price.replace(/[\s₽]/g, '').replace(',', '.'));
  return Number.isFinite(amount) && amount > 0 ? amount : null;
}

export const primaryConsultationMinimum = neurologistConsultationPrices
  .filter(({ neurologyConsultation }) => neurologyConsultation.visit === 'primary')
  .map(({ price }) => rubleAmount(price))
  .filter((amount): amount is number => amount !== null)
  .sort((a, b) => a - b)[0];

export const neurologistArticles = [
  {
    href: '/blog/kak-prohodit-pervichnyj-priyom-vracha-vertebrologanevrologa/',
    title: 'Как проходит первичный приём врача-вертебролога/невролога',
  },
  {
    href: '/blog/kak-ponyat-chto-s-bolyu-v-spine-pora-obratitsya-k-vrachu/',
    title: 'Как понять, что с болью в спине пора обратиться к врачу?',
  },
  {
    href: '/blog/mozhno-li-vylechit-gryzhu-pozvonochnika-bez-operacii-mnenie-nevrologa/',
    title: 'Можно ли вылечить грыжу позвоночника без операции? Мнение невролога',
  },
];
