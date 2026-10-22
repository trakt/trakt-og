import type { CardTag } from '../components/media/CardTag.ts';
import type { LiveWatch } from './fetchWatching.ts';

const TYPES: Readonly<Record<LiveWatch['target']['type'], string>> = {
  episode: 'Episode',
  movie: 'Movie',
  show: 'Show',
};

/** A live watch's card tags: the pulsing "Watching now" (or "Checked in"), then what it is. */
export function liveTags(watch: Pick<LiveWatch, 'kind' | 'target'>): readonly CardTag[] {
  return [
    { text: watch.kind === 'checkin' ? 'Checked in' : 'Watching now', kind: 'primary', live: true },
    { text: TYPES[watch.target.type], kind: 'generic' },
  ];
}
