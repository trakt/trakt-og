import type { CardTag } from '../components/media/CardTag.ts';
import type { CalendarCard } from './toCalendarCard.ts';

type CalendarTagsParams = {
  entry: Pick<CalendarCard, 'tags' | 'episode'>;
  /** Shows and movies on one calendar, where a movie needs saying. */
  mixed: boolean;
  /** Off where the time is shown on its own: the agenda's time column. */
  time?: boolean;
};

/** A calendar entry's card tags, split by where a card puts them. */
export type CalendarTags = {
  /** An episode's types (a premiere, a finale): over the art, or first on the line when there is none. */
  readonly types: readonly CardTag[];
  /** The caption's line: an episode's air time and network, or Movie on a calendar that mixes in shows. */
  readonly line: readonly CardTag[];
};

const MOVIE: CardTag = { text: 'Movie', kind: 'generic' };
const isLine = (tag: CardTag) => tag.kind === undefined || tag.kind === 'generic';

/** A calendar entry's card tags: an episode's types, air time and network; a movie's Movie tag when shows are mixed in. */
export function calendarTags({ entry, mixed, time = true }: CalendarTagsParams): CalendarTags {
  if (!entry.episode) return { types: [], line: mixed ? [MOVIE] : [] };
  const tags = entry.tags ?? [];
  return {
    types: tags.filter((tag) => !isLine(tag)),
    line: tags.filter((tag) => isLine(tag) && (time || tag.kind !== undefined)),
  };
}

/**
 * A calendar card's tags over its art's bottom-left corner, in red where they aren't an episode type: an episode's
 * types and air time, or Movie on a calendar that mixes in shows.
 */
export function calendarArtTags({ entry, mixed }: Omit<CalendarTagsParams, 'time'>): readonly CardTag[] {
  if (!entry.episode) return mixed ? [{ text: 'Movie' }] : [];
  return (entry.tags ?? []).filter((tag) => tag.kind !== 'generic');
}
