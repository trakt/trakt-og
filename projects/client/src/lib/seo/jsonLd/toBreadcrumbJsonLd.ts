import { uniqueBy } from '../../utils/uniqueBy.ts';
import type { Crumb } from './Crumb.ts';
import type { JsonLd } from './JsonLd.ts';
import { toAbsoluteUrl } from './toAbsoluteUrl.ts';

/** The trail down to a page: Shows › Severance › Season 1. Steps to the same page show once. */
export function toBreadcrumbJsonLd(crumbs: readonly Crumb[]): JsonLd {
  const steps = uniqueBy(crumbs, (crumb) => crumb.path ?? crumb.name);
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: steps.map((crumb, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: crumb.name,
      ...(crumb.path && { item: toAbsoluteUrl(crumb.path) }),
    })),
  };
}
