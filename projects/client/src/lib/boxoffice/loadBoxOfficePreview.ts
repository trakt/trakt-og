import { api } from '../api/api.ts';
import type { PreviewSource } from '../crawl/PreviewSource.ts';
import { BOX_OFFICE_LIST_ID } from './loadBoxOffice.ts';
import { toBoxOfficeSeo } from './toBoxOfficeSeo.ts';

/** The box office's head for a link-preview bot: the list's description is all it reads. */
export async function loadBoxOfficePreview({ fetch }: { fetch: typeof globalThis.fetch }): Promise<PreviewSource> {
  const list = await api({ fetch }).lists.summary({ params: { id: BOX_OFFICE_LIST_ID } });
  const seo = toBoxOfficeSeo(list.status === 200 ? (list.body.description ?? '') : '');
  return { seo, title: 'Weekend Box Office', href: '/movies/boxoffice' };
}
