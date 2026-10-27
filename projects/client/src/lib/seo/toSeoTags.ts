import { SEO_DEFAULTS } from './seoDefaults.ts';
import type { SeoMeta } from './SeoMeta.ts';
import { SITE_NAME } from './siteName.ts';
import { toSeoDescription } from './toSeoDescription.ts';
import { toRobots } from './toRobots.ts';
import { toSeoTitle } from './toSeoTitle.ts';
import { toShareImageUrl } from './toShareImageUrl.ts';

/** Where the head renders: SvelteKit's `page.route.id` and `page.status`. */
type PageContext = { readonly routeId: string | null; readonly status: number };

/** Every value the shared head writes, worked out from a page's {@link SeoMeta} and its route. */
export function toSeoTags(meta: SeoMeta, page: PageContext) {
  const title = meta.title?.trim() || SITE_NAME;
  const description = toSeoDescription(meta.description) || SEO_DEFAULTS.description;

  return {
    title: toSeoTitle(meta.title),
    description,
    robots: toRobots({ ...page, noindex: meta.noindex }),
    og: { title, description, type: meta.type ?? 'website' },
    image: meta.image ? { url: toShareImageUrl(meta.image), alt: meta.imageAlt ?? title } : null,
  };
}
