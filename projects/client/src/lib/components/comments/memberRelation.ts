import type { OverlaySlices } from '../../overlay/OverlaySlices.ts';

/**
 * How the viewer knows a comment's author, for the tag top right: a friend follows them back, and following is
 * one way. Nothing for the viewer themselves, deleted members or before the network loads.
 */
export function memberRelation(
  network: OverlaySlices['network'] | undefined,
  slug: string | undefined,
): 'friend' | 'following' | undefined {
  if (!network || !slug || !network.following.has(slug)) return undefined;
  return network.followers.has(slug) ? 'friend' : 'following';
}
