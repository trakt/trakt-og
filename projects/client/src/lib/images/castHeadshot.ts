import { mediaImage } from './mediaImage.ts';

/** The show or movie whose portraits a cast list shows. Seasons and episodes use their show. */
export type PortraitOf = { readonly media: 'show' | 'movie'; readonly id: number };

/**
 * A cast card's thumb. With `portraitOf`, it's the actor in character, falling back to their headshot, then to the
 * card's placeholder: most cast have no portrait, and a missing one is a 404.
 */
export function castHeadshot(personId: number, portraitOf?: PortraitOf): string {
  const headshot = mediaImage({ type: 'person', id: personId, slot: 'headshot', size: 'thumb' });
  if (!portraitOf) return headshot;
  return mediaImage({
    type: 'portrait',
    id: `${portraitOf.media}-${portraitOf.id}-${personId}`,
    slot: 'portrait',
    size: 'thumb',
    fallback: headshot,
  });
}
