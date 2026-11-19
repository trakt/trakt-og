import type { SocialWindow } from './socialWindows.ts';
import type { SocialMember, SocialTarget } from './toSocialItem.ts';

/**
 * A member's page. Their history is limited to the windows, and to one title with `item`; their ratings and comments
 * pages take no dates. Undefined for a deleted member.
 */
export function memberPageHref(
  member: SocialMember,
  windows: readonly SocialWindow[],
  page = 'history',
  item?: SocialTarget,
): string | undefined {
  const start = windows.at(-1)?.start;
  const end = windows.at(0)?.end;
  if (!member.href) return undefined;
  if (!page.startsWith('history') || !start || !end) return `${member.href}/${page}`;

  const search = new URLSearchParams({ start_at: start, end_at: end });
  if (item) search.set(item.type, `${item.id}`);
  return `${member.href}/${page}?${search}`;
}
