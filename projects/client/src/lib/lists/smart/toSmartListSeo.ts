import type { SeoMeta } from '../../seo/SeoMeta.ts';
import type { SmartList } from './SmartList.ts';
import { smartListSourceLabel } from './smartListSourceLabel.ts';

/** A smart list's page: its name, over where its titles come from. */
export const toSmartListSeo = ({
  name,
  source,
  mediaType,
}: Pick<SmartList, 'name' | 'source' | 'mediaType'>): SeoMeta => ({
  title: name,
  description: `A smart list that fills itself from ${smartListSourceLabel(source, mediaType)} on Trakt.`,
});
