import type { TagPill } from '../components/labels/TagPill.ts';
import type { ReleaseDate } from './toMovieReleases.ts';

/**
 * A release's tags: Limited for a limited run, its certification when it differs from the country's, then each part
 * of its note.
 */
export const releasePills = ({ limited, certification, notes }: ReleaseDate): readonly TagPill[] => [
  ...(limited ? [{ text: 'Limited' }] : []),
  ...(certification ? [{ text: certification, kind: 'badge' as const }] : []),
  ...notes.map((text) => ({ text })),
];
