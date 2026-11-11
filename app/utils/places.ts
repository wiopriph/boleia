// Place names that take an article in Portuguese ("do Huambo", "da Gabela"); the rest go without.
const PLACE_ARTICLES: Record<string, 'o' | 'a'> = {
  'huambo': 'o',
  'lubango': 'o',
  'lobito': 'o',
  'uige': 'o',
  'dondo': 'o',
  'soyo': 'o',
  'cuito': 'o',
  'sumbe': 'o',
  'dundo': 'o',
  'luena': 'o',
  'kilamba': 'o',
  'caxito': 'o',
  'waku-kungo': 'o',
  'gabela': 'a',
  'catumbela': 'a',
  'caala': 'a',
  'chibia': 'a',
};

const CONTRACTIONS = {
  de: { o: 'do', a: 'da' },
  para: { o: 'para o', a: 'para a' },
} as const;

export function placeWith(preposition: keyof typeof CONTRACTIONS, slug: string, name: string): string {
  const article = PLACE_ARTICLES[slug];

  return `${article ? CONTRACTIONS[preposition][article] : preposition} ${name}`;
}

export function routeTitle(route: { origin_slug: string, origin_name: string, destination_slug: string, destination_name: string }): string {
  return `${placeWith('de', route.origin_slug, route.origin_name)} ${placeWith('para', route.destination_slug, route.destination_name)}`;
}

export function routePath(originSlug: string, destinationSlug?: string): string {
  return destinationSlug ? `/boleias/${originSlug}-${destinationSlug}` : `/boleias/${originSlug}`;
}
