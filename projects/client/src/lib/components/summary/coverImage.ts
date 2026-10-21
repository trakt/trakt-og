import { api } from '../../api/api.ts';

export type CoverType = 'movie' | 'show' | 'episode';

interface CoverItem {
  readonly type: CoverType;
  readonly id: number;
}

const COVER_PATH = /\/images\/(movies|shows|episodes)\/(\d{3})\/(\d{3})\/(\d{3})\//;
const TYPES: Readonly<Record<string, CoverType>> = { movies: 'movie', shows: 'show', episodes: 'episode' };
const failed = 'Doh! We ran into some sort of error. Please try again.';

/** The settings only give the cover's image URL, so its type and id come from the zero-padded id in its path. */
export function isCoverOf(url: string | null | undefined, { type, id }: CoverItem): boolean {
  const [, folder = '', ...parts] = url?.match(COVER_PATH) ?? [];
  return TYPES[folder] === type && Number(parts.join('')) === id;
}

/** Makes an item's art the viewer's profile cover. */
export async function setCoverImage({ fetch, type, id }: CoverItem & { fetch: typeof globalThis.fetch }) {
  try {
    const { status } = await api({ fetch }).users.cover({ body: { cover_type: type, cover_id: id } });
    if (status === 204) return { ok: true, message: 'Cover image set! It now shows on your profile.' };
    return { ok: false, message: status === 403 ? 'This action requires VIP membership.' : failed };
  } catch {
    return { ok: false, message: failed };
  }
}
