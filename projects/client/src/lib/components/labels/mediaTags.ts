import { countLabel } from '../../utils/countLabel.ts';
import { formatRuntime } from '../../utils/formatRuntime.ts';
import type { TagPill } from './TagPill.ts';

type MediaTagsParams = {
  readonly type: 'show' | 'movie';
  /** Shows and movies together: the type leads the pills. */
  readonly mixed?: boolean;
  readonly year?: number;
  readonly certification?: string;
  readonly runtime?: number;
  readonly airedEpisodes?: number;
  readonly genres?: readonly string[];
  readonly network?: string;
};

/**
 * A show or movie's tag pills over its art: the type in a mix, the year, the certificate, runtime and episodes joined,
 * two genres joined and the network.
 */
export function mediaTags(item: MediaTagsParams): TagPill[] {
  return [
    ...(item.mixed ? [{ text: item.type === 'show' ? 'Show' : 'Movie', kind: 'primary' as const }] : []),
    ...(item.year ? [{ text: String(item.year) }] : []),
    ...(item.certification ? [{ text: item.certification, kind: 'badge' as const }] : []),
    ...segments([
      ...(item.runtime ? [formatRuntime(item.runtime)] : []),
      ...(item.airedEpisodes ? [countLabel(item.airedEpisodes, 'episode')] : []),
    ]),
    ...segments(item.genres?.slice(0, 2) ?? []),
    ...(item.network ? [{ text: item.network }] : []),
  ];
}

function segments(parts: readonly string[]): TagPill[] {
  return parts.length > 0 ? [{ segments: parts }] : [];
}
