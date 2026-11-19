import type { SocialItem } from './toSocialItem.ts';

type EpisodeTag = NonNullable<NonNullable<SocialItem['episode']>['type']>;

/** What stands out about a card, as a tag over its poster's bottom edge. */
export type SocialTag =
  | { readonly kind: 'episode'; readonly episode: EpisodeTag }
  | { readonly kind: 'loved'; readonly rating: number }
  | { readonly kind: 'binge'; readonly episodes: number }
  | { readonly kind: 'watchers'; readonly count: number };

const isWatch = (item: SocialItem) => item.kind === 'watch' || item.kind === 'checkin';

/** A run of this many episodes by one member is a binge. */
const BINGE = 3;
/** A rating this high is loved. */
const LOVED = 9;
/** This many people watching one title stands out. */
const WATCHERS = 3;

/**
 * What stands out, the first that applies: a premiere or finale when everyone watched that one episode, a binge, a
 * loved rating, several people watching it.
 */
export function tagOf(items: readonly SocialItem[]): SocialTag | undefined {
  const watches = items.filter(isWatch);
  const codes = new Set(watches.map(({ code }) => code));
  const special = codes.size === 1 ? watches[0]?.episode?.type : undefined;
  if (special) return { kind: 'episode', episode: special };
  const watched = new Map<string, Set<string>>();
  for (const { member, code } of watches) {
    if (code) watched.set(member.key, (watched.get(member.key) ?? new Set()).add(code));
  }
  const episodes = Math.max(0, ...[...watched.values()].map(({ size }) => size));
  if (episodes >= BINGE) return { kind: 'binge', episodes };
  const rating = Math.max(0, ...items.map((item) => (item.kind === 'rating' ? (item.rating ?? 0) : 0)));
  if (rating >= LOVED) return { kind: 'loved', rating };
  const watchers = new Set(watches.map(({ member }) => member.key)).size;
  return watchers >= WATCHERS ? { kind: 'watchers', count: watchers } : undefined;
}
