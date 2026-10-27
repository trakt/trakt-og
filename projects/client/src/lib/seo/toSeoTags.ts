import { SEO_DEFAULTS } from './seoDefaults.ts';
import type { SeoMeta } from './SeoMeta.ts';
import { SITE_NAME } from './siteName.ts';
import { toSeoDescription } from './toSeoDescription.ts';
import { toCanonicalUrl } from './toCanonicalUrl.ts';
import { toRobots } from './toRobots.ts';
import { toSeoTitle } from './toSeoTitle.ts';
import { toShareImageUrl } from './toShareImageUrl.ts';

/** Where the head renders: SvelteKit's `page.url`, `page.route.id` and `page.status`. */
type PageContext = { readonly url: URL; readonly routeId: string | null; readonly status: number };

/** Every value the shared head writes, worked out from a page's {@link SeoMeta} and its route. */
export function toSeoTags(meta: SeoMeta, page: PageContext) {
  const title = meta.title?.trim() || SITE_NAME;
  const description = toSeoDescription(meta.description) || SEO_DEFAULTS.description;
  const canonical = toCanonicalUrl({ url: page.url, path: meta.canonicalPath });

  return {
    title: toSeoTitle(meta.title),
    description,
    robots: toRobots({ routeId: page.routeId, status: page.status, noindex: meta.noindex }),
    /** An error page has no URL of its own to point at. */
    canonical: page.status < 400 ? canonical : null,
    og: { title, description, type: meta.type ?? 'website', url: canonical },
    image: meta.image ? { url: toShareImageUrl(meta.image), alt: meta.imageAlt ?? title } : null,
  };
}
