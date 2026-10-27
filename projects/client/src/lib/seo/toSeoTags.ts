import { SEO_DEFAULTS } from './seoDefaults.ts';
import type { SeoMeta } from './SeoMeta.ts';
import { SITE_NAME } from './siteName.ts';
import { toSeoDescription } from './toSeoDescription.ts';
import { toSeoTitle } from './toSeoTitle.ts';
import { toShareImageUrl } from './toShareImageUrl.ts';

/** Every value the shared head writes, worked out from a page's {@link SeoMeta}. */
export function toSeoTags(meta: SeoMeta) {
  const title = meta.title?.trim() || SITE_NAME;
  const description = toSeoDescription(meta.description) || SEO_DEFAULTS.description;

  return {
    title: toSeoTitle(meta.title),
    description,
    og: { title, description, type: meta.type ?? 'website' },
    image: meta.image ? { url: toShareImageUrl(meta.image), alt: meta.imageAlt ?? title } : null,
  };
}
