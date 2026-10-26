import type { ComponentProps } from 'svelte';
import type { CardTag } from '../components/media/CardTag.ts';
import type EpisodeTypeBadge from '../components/media/EpisodeTypeBadge.svelte';
import type { SeasonOf } from '../overlay/createOverlay.svelte.ts';

/** The art a result can draw, one per Artwork choice. Each is left out when the API has none. */
type SearchArt = {
  readonly poster?: string;
  /** A movie's or show's fanart, or an episode's screenshot. */
  readonly fanart?: string;
  readonly logo?: string;
  /** The show's fanart in place of an episode's screenshot, for a viewer who hides spoilers. */
  readonly spoilerFanart?: string;
};

export type SearchCard = {
  key: string;
  type: 'movie' | 'show' | 'episode' | 'person';
  id: number;
  href: string;
  title: string;
  /** Lighter after the title, like OG's `item_year_title`. */
  year?: number;
  /** An episode's "1x01", bold before its title. */
  number?: string;
  /** An episode's show, small over its title. */
  smallTitle?: { text: string; href: string };
  overview?: string;
  /** A movie's or show's details, for the tag pills. */
  certification?: string;
  network?: string;
  genres?: readonly string[];
  art: SearchArt;
  /** The type, then a movie's runtime and certification, a show's network and episodes, an episode's air date, or a
   * person's age and what they're known for. */
  tags: CardTag[];
  /** Out by `now`. Unreleased items get no rating or watch-now icon. */
  released: boolean;
  rating?: number;
  airedEpisodes?: number;
  /** Episode library state is keyed by its show, season and episode number. */
  season?: SeasonOf;
  runtime?: number;
  episodeBadge?: ComponentProps<typeof EpisodeTypeBadge>;
};
