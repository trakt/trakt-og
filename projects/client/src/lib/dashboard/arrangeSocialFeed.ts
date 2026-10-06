import type { SocialSitting } from './fetchSocialFeed.ts';
import type { LiveWatch } from './fetchWatching.ts';
import type { Sitting } from './groupSittings.ts';

export type LiveTile = {
  readonly kind: 'live';
  readonly watch: LiveWatch;
  /** How far in, 0 to 100. */
  readonly progress: number;
  readonly minutesLeft: number;
  /** Watches in the member's sitting from the last 6 hours, which the tile stands in for. */
  readonly earlier: number;
};

export type SittingTile = { readonly kind: 'sitting'; readonly sitting: SocialSitting };

export type SocialFeedLayout = {
  /** Four at most: who's watching now, newest start first, then everyone else's latest sitting. */
  readonly tiles: readonly (LiveTile | SittingTile)[];
  /** With five or more watching, the ones past the first three, behind the "+N watching" tile. */
  readonly overflow: readonly LiveTile[];
  /** The sittings no tile shows. */
  readonly timeline: readonly SocialSitting[];
  /** Members in `overflow`, whose rows say they're watching now. */
  readonly watchingNow: ReadonlySet<string>;
};

const TILES = 4;
const RECENT_MS = 6 * 3_600_000;

type ArrangeSocialFeedParams = { sittings: readonly SocialSitting[]; live: readonly LiveWatch[]; now: Date };

/**
 * Lays the feed out: live tiles first, each member's latest sitting in the slots left, and the rest in the timeline.
 * A live member's sittings from the last 6 hours leave the timeline, since their tile covers them. A watch past its
 * `expires_at` is dropped.
 */
export function arrangeSocialFeed({ sittings, live, now }: ArrangeSocialFeedParams): SocialFeedLayout {
  const at = now.getTime();
  const recent = (sitting: Sitting) => at - Date.parse(sitting.newest) < RECENT_MS;
  const mine = (watch: LiveWatch) => (sitting: Sitting) => sitting.member.key === watch.member.key && recent(sitting);

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
        earlier: sittings.filter(mine(watch)).flatMap(({ items }) => items)
          .filter(({ kind }) => kind === 'watch' || kind === 'checkin').length,
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
  const covered = new Set([
    ...fill.map(({ key }) => key),
    ...shown.flatMap(({ watch }) => sittings.filter(mine(watch)).map(({ key }) => key)),
  ]);

  return {
    tiles: [...shown, ...fill.map((sitting): SittingTile => ({ kind: 'sitting', sitting }))],
    overflow,
    timeline: sittings.filter(({ key }) => !covered.has(key)),
    watchingNow: new Set(overflow.map(({ watch }) => watch.member.key)),
  };
}
