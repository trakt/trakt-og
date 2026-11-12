import type { ProfileUser } from '../../users/ProfileUser.ts';
import type { SeoMeta } from '../SeoMeta.ts';

/** A private profile's pages for a visitor who can't see it: the name alone, kept out of search. */
export const toLockedProfileSeo = ({ displayName }: Pick<ProfileUser, 'displayName'>): SeoMeta => ({
  title: `${displayName}'s profile`,
  noindex: true,
});
