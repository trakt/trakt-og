import type { DescribedSitting, SocialSitting } from './fetchSocialFeed.ts';
import type { LiveWatch } from './fetchWatching.ts';

export type LiveTile = {
  readonly kind: 'live';
  readonly watch: LiveWatch;
  /** How far in, 0 to 100. */
  readonly progress: number;
  readonly minutesLeft: number;
};

/** A sitting's lead title, the one watched last. */
export type SittingTile = { readonly kind: 'sitting'; readonly sitting: DescribedSitting };

export type SocialFeedLayout = {
  /** Four at most: who's watching now, newest start first, then the lead title of everyone else's latest sitting. */
  readonly tiles: readonly (LiveTile | SittingTile)[];
  /** With five or more watching, the ones past the first three, behind the "+N watching" tile. */
  readonly overflow: readonly LiveTile[];
  /** Newest first: the sittings no tile shows, and the rest of each one a tile shows. */
  readonly timeline: readonly DescribedSitting[];
  /** Members in `overflow`, whose rows say they're watching now. */
  readonly watchingNow: ReadonlySet<string>;
};

const TILES = 4;

type ArrangeSocialFeedParams = { sittings: readonly SocialSitting[]; live: readonly LiveWatch[]; now: Date };

/**
 * Lays the feed out: live tiles first, then each member's latest sitting in the slots left. A sitting's tile shows only
 * its lead title, so the rest of it stays in the timeline, re-sorted since it ends earlier. A watch past its
 * `expires_at` is dropped.
 */
export function arrangeSocialFeed({ sittings, live, now }: ArrangeSocialFeedParams): SocialFeedLayout {
  const at = now.getTime();

  const active = live
    .filter(({ expiresAt }) => Date.parse(expiresAt) > at)
    .toSorted((a, b) => Date.parse(b.startedAt) - Date.parse(a.startedAt))
    .map((watch): LiveTile => {
      const started = Date.parse(watch.startedAt);
      const expires = Date.parse(watch.expiresAt);
      const share = expires > started ? (at - started) / (expires - started) : 1;
      return {
        kind: 'live',
        watch,
        progress: Math.round(Math.min(Math.max(share, 0), 1) * 100),
        minutesLeft: Math.max(1, Math.round((expires - at) / 60_000)),
      };
    });

  const shown = active.length > TILES ? active.slice(0, TILES - 1) : active;
  const overflow = active.slice(shown.length);
  const tileMembers = new Set(shown.map(({ watch }) => watch.member.key));
  const latest = sittings.filter((sitting, i) =>
    sittings.findIndex(({ member }) => member.key === sitting.member.key) === i
  );
  const fill = overflow.length > 0
    ? []
    : latest.filter(({ member }) => !tileMembers.has(member.key)).slice(0, TILES - shown.length);
  const filled = new Set(fill.map(({ key }) => key));
  const left = (sitting: SocialSitting) => (filled.has(sitting.key) ? sitting.split.rest : sitting);

  return {
    tiles: [...shown, ...fill.map(({ split }): SittingTile => ({ kind: 'sitting', sitting: split.lead }))],
    overflow,
    timeline: sittings.flatMap((sitting) => left(sitting) ?? [])
      .toSorted((a, b) => Date.parse(b.newest) - Date.parse(a.newest)),
    watchingNow: new Set(overflow.map(({ watch }) => watch.member.key)),
  };
}
