import { toItemListJsonLd } from '../jsonLd/toItemListJsonLd.ts';
import type { SeoMeta } from '../SeoMeta.ts';

type Params = {
  name: string;
  description?: string | null;
  path: string;
  itemCount: number;
  /** A personal list's owner, by display name. Official lists have none. */
  owner?: string;
  /** The first item's fanart. */
  image?: string;
  /** The first page's items by path, for an `ItemList`. Left out on later pages and on lists search engines skip. */
  items?: readonly string[];
};

const itemsLine = (count: number) =>
  count === 1 ? '1 movie or show.' : `${count.toLocaleString('en-US')} movies and shows.`;

/** A list page: "Best of 2024", or "Best of 2024 by Justin Nemeth", its description and its first item's fanart. */
export function toListSeo({ name, description, path, itemCount, owner, image, items }: Params): SeoMeta {
  const title = owner ? `${name} by ${owner}` : name;
  return {
    title,
    description: description || itemsLine(itemCount),
    image,
    imageAlt: title,
    jsonLd: items ? [toItemListJsonLd({ name: title, description, path, itemCount, items })] : [],
  };
}
