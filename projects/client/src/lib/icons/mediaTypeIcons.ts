import circlePlay from '#lib/icons/regular/circle-play.svg?raw';
import clapperboard from '#lib/icons/regular/clapperboard.svg?raw';
import seasons from '#lib/icons/regular/rectangle-history.svg?raw';
import tvRetro from '#lib/icons/regular/tv-retro.svg?raw';

export type MediaTypeIcon = 'movie' | 'show' | 'season' | 'episode';

/** The blue icon a toolbar count takes for one media type. A mix of types takes the poster stack. */
export const mediaTypeIcons: Readonly<Record<MediaTypeIcon, string>> = {
  movie: clapperboard,
  show: tvRetro,
  season: seasons,
  episode: circlePlay,
};

/** The retro TV's antennas sit it low, so its counts lift it level. */
export const mediaTypeIconShift = (type: string | undefined) =>
  type === 'show' ? 'var(--stat-tv-icon-shift)' : undefined;
