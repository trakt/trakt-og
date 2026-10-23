import { pickHomeFanarts } from '../home/pickHomeFanarts.ts';
import type { AboutFavorite } from './AboutFavorite.ts';
import type { AboutMember } from './AboutMember.ts';

/** The favorites a member's panel shows. */
const SHOWN = 5;

/** A member as one visit shows them: a shuffled handful of favorites, and the cover from one that has fanart. */
export type AboutMemberPick = AboutMember & { readonly cover: string | null };

interface PickAboutTeamParams {
  team: readonly AboutMember[];
  /** `Math.random`, or a fixed sequence in tests. */
  random: () => number;
}

const coverOf = (favorites: readonly AboutFavorite[]) => favorites.find((favorite) => favorite.fanart)?.fanart ?? null;

/** Shuffles the team's order and each member's favorites for this visit, and picks each panel's cover. */
export function pickAboutTeam({ team, random }: PickAboutTeamParams): AboutMemberPick[] {
  return pickHomeFanarts({ pool: team, count: team.length, random }).map((member) => {
    const favorites = pickHomeFanarts({ pool: member.favorites, count: member.favorites.length, random });
    return { ...member, favorites: favorites.slice(0, SHOWN), cover: coverOf(favorites) };
  });
}
