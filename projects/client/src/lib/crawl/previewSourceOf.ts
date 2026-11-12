import type { SeoMeta } from '../seo/SeoMeta.ts';
import type { SubpageFrameMedia } from '../subpage/SubpageFrameMedia.ts';
import type { PreviewSource } from './PreviewSource.ts';

type Params = {
  seo: SeoMeta;
  media: SubpageFrameMedia;
  type: string;
  fullTitle?: string;
};

/** A preview source whose subpages name their item as the item subpages do: by `media`, from the page's own mapper. */
export function previewSourceOf({ seo, media, type, fullTitle }: Params): PreviewSource {
  return {
    seo,
    title: media.item.title,
    href: media.href,
    image: media.preview,
    parents: media.parents,
    type,
    fullTitle,
  };
}
