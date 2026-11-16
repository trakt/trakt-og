import { mediaImage } from './mediaImage.ts';

/**
 * A cast card's thumb. On a show it's the actor in character, falling back to their headshot, then to the card's
 * placeholder: most cast have no character photo, and a missing one is a 404. Movies have none.
 */
export function castHeadshot(personId: number, showId?: number): string {
  const headshot = mediaImage({ type: 'person', id: personId, slot: 'headshot', size: 'thumb' });
  if (showId === undefined) return headshot;
  return mediaImage({
    type: 'character',
    id: `${showId}-${personId}`,
    slot: 'headshot',
    size: 'thumb',
    fallback: headshot,
  });
}
