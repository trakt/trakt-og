import { z } from 'zod/v4';
import { smartListPath } from '../lists/smart/smartListPath.ts';

/** How many lists a member can pin to the dashboard: each is one more read on every visit. */
export const MAX_LIST_PINS = 5;

/** A list pinned to the dashboard, as the og-dashboard cookie keeps it. */
export const listPinSchema = z.object({
  kind: z.enum(['personal', 'official', 'smart', 'watchlist', 'favorites']),
  /** The list's Trakt id, or a smart list's slug. Empty for a watchlist or favorites. */
  id: z.string(),
  /** The owner's slug. Empty for an official list. */
  owner: z.string(),
  /** The name when it was pinned, refreshed when the member opens the list again. */
  name: z.string(),
  /** The owner's username, on someone else's list. */
  by: z.string().optional(),
  /** The owner's avatar, beside their username. */
  avatar: z.string().optional(),
  hidden: z.boolean().optional(),
  /** The sort picked on its panel. Left out, the list's own. */
  sort: z.object({ by: z.string(), how: z.enum(['asc', 'desc']) }).optional(),
  /** The eye's Hide options picked on its panel. */
  hide: z.array(z.string()).optional(),
});

export type ListPin = z.infer<typeof listPinSchema>;

/** A pinned list's place in the dashboard's order. */
export type PinKey = `pin:${string}`;

export const pinKey = ({ kind, owner, id }: Pick<ListPin, 'kind' | 'owner' | 'id'>): PinKey =>
  `pin:${kind}:${owner}:${id}`;

export const isPinKey = (section: string): section is PinKey => section.startsWith('pin:');

/** Each readable pin once, dropping any the cookie mangled and any past the cap. */
export const listPinsSchema = z
  .array(z.unknown())
  .catch([])
  .transform((saved) =>
    saved
      .flatMap((entry) => {
        const pin = listPinSchema.safeParse(entry);
        return pin.success ? [pin.data] : [];
      })
      .filter((pin, index, pins) => pins.findIndex((other) => pinKey(other) === pinKey(pin)) === index)
      .slice(0, MAX_LIST_PINS),
  );

const users = (owner: string) => `/users/${encodeURIComponent(owner)}`;

/** The list's own page. */
export function pinHref(pin: ListPin): string {
  if (pin.kind === 'smart') return smartListPath(pin.owner, pin.id);
  if (pin.kind === 'official') return `/lists/${encodeURIComponent(pin.id)}`;
  if (pin.kind === 'personal') return `${users(pin.owner)}/lists/${encodeURIComponent(pin.id)}`;
  return `${users(pin.owner)}/${pin.kind}`;
}

/** The items path before its `/:type/:sort_by/:sort_how` segments, for any pin but a smart list's. */
export function pinItemsBase(pin: ListPin): string {
  if (pin.kind === 'official') return `/lists/${encodeURIComponent(pin.id)}/items`;
  if (pin.kind === 'personal') return `${users(pin.owner)}/lists/${encodeURIComponent(pin.id)}/items`;
  return `${users(pin.owner)}/${pin.kind}`;
}

type PinForParams = {
  list: {
    readonly kind: ListPin['kind'];
    readonly id: number | string;
    readonly ownerSlug: string;
    readonly name: string;
  };
  viewer: string;
  /** Shown on someone else's list: their username (the slug where it isn't known) and avatar. */
  owner: { readonly username?: string; readonly avatar?: string };
};

/** What pinning the list keeps. Null for the viewer's own watchlist, which has its own panel. */
export function pinFor({ list, viewer, owner }: PinForParams): Omit<ListPin, 'hidden'> | null {
  const own = list.ownerSlug === viewer;
  if (own && list.kind === 'watchlist') return null;
  const builtIn = list.kind === 'watchlist' || list.kind === 'favorites';
  const official = list.kind === 'official';
  return {
    kind: list.kind,
    id: builtIn ? '' : String(list.id),
    owner: official ? '' : list.ownerSlug,
    name: list.name,
    ...(!own && !official && { by: owner.username ?? list.ownerSlug, ...(owner.avatar && { avatar: owner.avatar }) }),
  };
}
