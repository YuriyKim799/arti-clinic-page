type RelatedService = { href: string; label: string; topic: RegExp };

const serviceTopics: RelatedService[] = [
  {
    href: '/services/nevrolog',
    label: 'Консультация невролога',
    topic: /(?:^|[^\p{L}])(?:невролог(?:а|у|ом|е|и|ов|ам|ами|ах)?(?!\p{L})|неврологическ(?:ий|ого|ому|им|ом|ая|ой|ую|ое|ие|их|ими)\s+(?:осмотр|консультац)\p{L}*)/iu,
  },
  {
    href: '/services/programma-lecheniya-gryzhi-v-moskve',
    label: 'Лечение межпозвоночной грыжи',
    topic: /грыж|межпозвон(?:ков|очн).*диск/iu,
  },
  {
    href: '/services/reflexotherapy',
    label: 'Иглорефлексотерапия и иглоукалывание',
    topic: /игло(?:рефлексотерап|укалыван|терап)|рефлексотерап|акупунктур/iu,
  },
  {
    href: '/services/manual-therapy',
    label: 'Мануальная терапия',
    topic: /мануальн/iu,
  },
];

// Link only when the topic is explicitly named; symptoms alone do not select treatment.
export function relatedServicesForText(text: string): { href: string; label: string }[] {
  return serviceTopics.filter(({ topic }) => topic.test(text))
    .map(({ href, label }) => ({ href, label }));
}

// A short selection of existing published articles, not the entire blog index.
// The same explicit topic rules determine links in both directions.
const serviceReading = [
  { slug: 'manualnaya-terapiya-mify-i-realnost', title: 'Мануальная терапия: мифы и реальность' },
  { slug: 'massazh-ili-manualnaya-terapiya-chto-vybrat-pri-boli-v-poyasnice', title: 'Массаж или мануальная терапия — что выбрать при боли в пояснице?' },
  { slug: 'mify-o-refleksoterapii-chto-pravda-a-chto-vymysel', title: 'Мифы о рефлексотерапии: что правда, а что вымысел?' },
  { slug: 'refleksoterapiya-s-tochki-zreniya-dokazatelnoj-mediciny', title: 'Рефлексотерапия с точки зрения доказательной медицины' },
  { slug: 'mozhno-li-vylechit-gryzhu-pozvonochnika-bez-operacii-mnenie-nevrologa', title: 'Можно ли вылечить грыжу позвоночника без операции? Мнение невролога' },
  { slug: 'kak-lechat-gryzhu-mezhpozvonkovogo-diska-bez-operacij', title: 'Как лечат грыжу межпозвонкового диска без операций?' },
] as const;

export function relatedArticlesForService(slug: string): { href: string; label: string }[] {
  const href = `/services/${slug}`;
  return serviceReading
    .filter(article => relatedServicesForText(article.title).some(service => service.href === href))
    .map(article => ({ href: `/blog/${article.slug}/`, label: article.title }));
}
