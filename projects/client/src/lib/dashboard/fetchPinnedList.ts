import { z } from 'zod/v4';
import { rawApiFetch } from '../api/rawApiFetch.ts';
import { fetchListItems } from '../lists/loadListItems.ts';
import { fetchSmartListItems } from '../lists/smart/loadSmartList.ts';
import type { DatePreferences } from '../settings/DatePreferences.ts';
import { type ListPin, pinItemsBase } from './listPins.ts';
import { type ListPanel, readPanelItems, toListPanel } from './toListPanel.ts';

type FetchPinnedListParams = {
  fetch: typeof globalThis.fetch;
  pin: ListPin;
  datePreferences: DatePreferences;
};

export type PinnedList =
  | ({
      readonly status: 'loaded';
      /** The list shows its rank numbers: its owner's Rank numbers setting, always on for favorites. */
      readonly numbers: boolean;
    } & ListPanel)
  /** Deleted, made private, or its owner blocked or unfollowed the viewer. */
  | { readonly status: 'gone' };

const GONE = [204, 401, 403, 404];
const SMART_DEFAULT = { by: 'rank', how: 'asc' } as const;
const settingsSchema = z.object({ display_numbers: z.boolean().catch(false) });

/** The list's Rank numbers setting, read fresh so a change shows. A smart list and the watchlist have none. */
async function displaysNumbers({ fetch, pin }: Pick<FetchPinnedListParams, 'fetch' | 'pin'>): Promise<boolean> {
  if (pin.kind === 'favorites') return true;
  if (pin.kind !== 'personal' && pin.kind !== 'official') return false;
  const id = encodeURIComponent(pin.id);
  const path = pin.kind === 'official' ? `/lists/${id}` : `/users/${encodeURIComponent(pin.owner)}/lists/${id}`;
  const response = await rawApiFetch({ fetch, token: null, path }).catch(() => null);
  if (!response?.ok) return false;
  return settingsSchema.safeParse(await response.json().catch(() => null)).data?.display_numbers ?? false;
}

/**
 * A pinned list's panel: its first 18 items in the sort picked on the panel, or else the list's own (a smart list's
 * rank), and the whole list while the panel hides some, with whether it shows its rank numbers. One the viewer can no
 * longer see comes back gone, so its panel steps aside.
 */
export async function fetchPinnedList({ fetch, pin, datePreferences }: FetchPinnedListParams): Promise<PinnedList> {
  const sort = pin.sort ?? (pin.kind === 'smart' ? SMART_DEFAULT : undefined);
  const numbers = displaysNumbers({ fetch, pin });
  const { items, scope } = await readPanelItems({
    read: (page, limit, by) =>
      pin.kind === 'smart'
        ? fetchSmartListItems({ fetch, token: null, slug: pin.id, sort: by ?? SMART_DEFAULT, page, limit })
        : fetchListItems({
            fetch,
            token: null,
            base: pinItemsBase(pin),
            query: { types: [], genres: [], page, limit },
            ...(by && { sort: by }),
          }),
    sort,
    hiding: (pin.hide?.length ?? 0) > 0,
  });
  if (GONE.includes(items.status)) return { status: 'gone' };
  if (items.status !== 200) throw new Error(`The pinned list failed with ${items.status}`);
  return { status: 'loaded', numbers: await numbers, ...toListPanel({ items, sort, scope, datePreferences }) };
}
