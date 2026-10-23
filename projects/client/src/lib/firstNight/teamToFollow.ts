import { api } from '../api/api.ts';
import { PLACEHOLDER_AVATAR } from '../users/placeholderAvatar.ts';

/** A Trakt team member a new member can follow from an empty Social Feed. */
export type TeamMember = {
  readonly slug: string;
  readonly name: string;
  readonly avatar: string;
  readonly location: string | null;
  readonly isPrivate: boolean;
};

/** Four rows of two beside the feed's quote. */
const SHOWN = 8;

/** The Trakt team in a fresh random order each visit, read without a token. A failure comes back empty. */
export async function fetchTeamToFollow(
  fetch: typeof globalThis.fetch,
  random: () => number = Math.random,
): Promise<TeamMember[]> {
  try {
    const team = await api({ fetch }).team.members({ query: { extended: 'full,images' } });
    if (team.status !== 200) return [];
    return team.body
      .map(({ user }) => ({
        slug: user.ids.slug ?? user.username,
        name: user.name?.trim() || user.username,
        avatar: user.images?.avatar.full ?? PLACEHOLDER_AVATAR,
        // The city alone, as the about page's roster shows it: "Serrana, Brazil" is Serrana.
        location: user.location?.split(',').at(0)?.trim() || null,
        isPrivate: user.private,
      }))
      .map((member) => ({ member, order: random() }))
      .toSorted((a, b) => a.order - b.order)
      .slice(0, SHOWN)
      .map(({ member }) => member);
  } catch {
    return [];
  }
}
