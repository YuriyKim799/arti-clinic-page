type RelatedService = { href: string; label: string; topic: RegExp };

const serviceTopics: RelatedService[] = [
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
