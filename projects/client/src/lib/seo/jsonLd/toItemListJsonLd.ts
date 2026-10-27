import { toSeoDescription } from '../toSeoDescription.ts';
import { compact } from './compact.ts';
import type { JsonLd } from './JsonLd.ts';
import { toAbsoluteUrl } from './toAbsoluteUrl.ts';

type Params = {
  name: string;
  description?: string | null;
  path: string;
  itemCount: number;
  /** The first page's items, in order, by path. */
  items: readonly string[];
};

/** A list as schema.org's `ItemList`: its whole size, and the first page's items by position. */
export function toItemListJsonLd({ name, description, path, itemCount, items }: Params): JsonLd {
  return compact({
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name,
    description: toSeoDescription(description),
    url: toAbsoluteUrl(path),
    numberOfItems: itemCount,
    itemListElement: items.map((item, i) => ({ '@type': 'ListItem', position: i + 1, url: toAbsoluteUrl(item) })),
  });
}
