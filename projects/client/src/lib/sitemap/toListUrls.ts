import { listPath } from '../lists/listPath.ts';
import { uniqueBy } from '../utils/uniqueBy.ts';
import { toLastmod } from './toLastmod.ts';
import type { SitemapUrl } from './SitemapUrl.ts';

type List = {
  readonly type: string;
  readonly privacy: string;
  readonly updated_at?: string | null;
  readonly ids: { readonly trakt: number; readonly slug: string };
  readonly user: {
    readonly username: string;
    readonly private: boolean;
    readonly deleted: boolean;
    readonly ids: { readonly slug?: string | null };
  };
};

// A private owner's profile is locked and kept out of search, and a deleted owner's is gone.
const isIndexable = ({ privacy, user }: List) => privacy === 'public' && !user.private && !user.deleted;

/** List pages, the first of each list in the order given, dated by the list's `updated_at`. */
export function toListUrls(lists: readonly List[]): SitemapUrl[] {
  return uniqueBy(lists.filter(isIndexable), ({ ids }) => ids.trakt).map((list) => ({
    path: listPath(list),
    lastmod: toLastmod(list.updated_at),
  }));
}
