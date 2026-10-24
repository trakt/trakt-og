import type { NetworkExtra } from './NetworkExtra.ts';
import { capitalize } from '../../utils/capitalize.ts';

type ExtraRow = {
  readonly followed_at?: string | null;
  readonly user: { readonly vip_veteran_title?: string | null };
};

/** Each row's VIP veteran title and follow date, by the slug its card is keyed on. */
export function toNetworkExtras(
  rows: readonly { readonly slug: string; readonly row: ExtraRow }[],
): Readonly<Record<string, NetworkExtra>> {
  return Object.fromEntries(
    rows.map(({ slug, row }) => {
      const veteran = row.user.vip_veteran_title?.trim();
      return [slug, { veteran: veteran ? capitalize(veteran) : null, since: row.followed_at ?? null }];
    }),
  );
}
