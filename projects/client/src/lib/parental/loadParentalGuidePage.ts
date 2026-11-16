import { api } from '../api/api.ts';
import { okBody } from '../api/okBody.ts';
import { rawApiFetch } from '../api/rawApiFetch.ts';
import { watchNowCountry } from '../settings/watchNowCountry.ts';
import { loadSubpageMedia } from '../subpage/loadSubpageMedia.ts';
import { fetchParentalGuide } from './fetchParentalGuide.ts';
import { releaseCertifications } from './releaseCertifications.ts';
import { showCertificationsSchema } from './showCertificationsSchema.ts';
import { toCertificationGroups } from './toCertificationGroups.ts';

type Params = Pick<Parameters<typeof loadSubpageMedia>[0], 'fetch' | 'parent'> & {
  token: string | null;
  item: { readonly type: 'movie' | 'show'; readonly id: string };
};

/** Every country's rating: a show's from its certifications, a movie's from its releases. Empty when the read fails. */
async function readCertifications({ fetch, item }: Pick<Params, 'fetch' | 'item'>) {
  if (item.type === 'movie') {
    const releases = await okBody(api({ fetch }).movies.releases({ params: { id: item.id } }));
    return releaseCertifications(releases ?? []);
  }
  const response = await rawApiFetch({ fetch, path: `/shows/${item.id}/certifications` }).catch(() => null);
  if (response?.status !== 200) return [];
  const body = showCertificationsSchema.safeParse(await response.json().catch(() => null));
  return body.success ? body.data : [];
}

/**
 * A movie's or show's parental guide page: the subpage header, the guide (signed-in viewers only, as the API
 * requires) and every country's rating grouped by age, led by the origin country and the viewer's. Neither read is
 * required; the page says when both are empty.
 */
export async function loadParentalGuidePage({ fetch, token, parent, item }: Params) {
  const [subpage, certifications, guide] = await Promise.all([
    loadSubpageMedia({ fetch, parent, item, suffix: 'parental-guide', neighbours: false }),
    readCertifications({ fetch, item }),
    fetchParentalGuide({ fetch, token, type: item.type, id: item.id }),
  ]);
  return {
    ...subpage,
    guide,
    certifications: toCertificationGroups({
      certifications,
      origin: subpage.media.country ?? null,
      viewer: subpage.user ? watchNowCountry(subpage.settings) : null,
    }),
  };
}
