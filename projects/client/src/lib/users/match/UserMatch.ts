import type { MatchLevel } from './MatchLevel.ts';

/** How the signed-in viewer's taste lines up with a profile owner's. Percentages are whole numbers from 0 to 100. */
export interface UserMatch {
  readonly score: number;
  readonly level: MatchLevel;
  /** How alike the sub-genres they watch most are. */
  readonly subgenres: number;
  /** How many favorites they share, weighed against how many each has. */
  readonly favorites: number;
  /**
   * Most telling first. `top` is the most telling one and any few members watch, `strong` the next two, `light` the
   * rest, like v3's chips.
   */
  readonly sharedSubgenres: readonly {
    readonly name: string;
    readonly slug: string;
    readonly tier: 'top' | 'strong' | 'light';
  }[];
  /** Trakt ids. */
  readonly sharedFavorites: { readonly movies: readonly number[]; readonly shows: readonly number[] };
}
