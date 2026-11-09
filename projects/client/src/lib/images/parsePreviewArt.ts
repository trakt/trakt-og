import type { MediaImageSlot } from './MediaImageSlot.ts';
import type { MediaImageType } from './MediaImageType.ts';
import type { PreviewArtRef } from './PreviewArtRef.ts';

const TYPES: ReadonlySet<string> = new Set<MediaImageType>(['movie', 'show', 'season', 'episode', 'person']);
const SLOTS: ReadonlySet<string> = new Set<MediaImageSlot>(['poster', 'fanart', 'screenshot', 'headshot']);
const MAX_REFS = 3;

const isType = (value: string): value is MediaImageType => TYPES.has(value);
const isSlot = (value: string): value is MediaImageSlot => SLOTS.has(value);

/** The art refs in an `/api/art/{type}/{id}/{slot}/…` path (`previewArt`), or null for anything else. */
export function parsePreviewArt(path: string): readonly PreviewArtRef[] | null {
  const parts = path.split('/');
  if (parts.length === 0 || parts.length % 3 !== 0 || parts.length / 3 > MAX_REFS) return null;
  const refs = Array.from({ length: parts.length / 3 }, (_, i) => parts.slice(i * 3, i * 3 + 3)).map(
    ([type = '', id = '', slot = '']) =>
      isType(type) && /^\d{1,10}$/.test(id) && isSlot(slot) ? { type, id: Number(id), slot } : null,
  );
  return refs.every((ref) => ref !== null) ? refs : null;
}
