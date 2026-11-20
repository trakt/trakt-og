import type { PortraitId } from './mediaFolder.ts';
import { mediaImage, withFallback } from './mediaImage.ts';

/** The show or movie whose portraits a cast list shows. */
export type PortraitOf = {
  readonly media: 'show' | 'movie';
  readonly id: number;
  /** A season's or episode's cast tries the season's portrait before the show's. */
  readonly season?: number;
  /** The week's link token (`loadPortraitToken`): media.trakt.tv refuses a portrait link without it. */
  readonly token: string;
};

const portrait = (id: PortraitId, token: string, fallback: string) =>
  withFallback(`${mediaImage({ type: 'portrait', id, slot: 'portrait', size: 'thumb' })}?verify=${token}`, fallback);

/**
 * A cast card's thumb. With `portraitOf`, it's the actor in character: the season's portrait, then the show's, then
 * their headshot, then the card's placeholder. Most cast have no portrait, and a missing one is a 404.
 */
export function castHeadshot(personId: number, portraitOf?: PortraitOf): string {
  const headshot = mediaImage({ type: 'person', id: personId, slot: 'headshot', size: 'thumb' });
  if (!portraitOf) return headshot;
  const { media, id, season, token } = portraitOf;
  const title = portrait(`${media}-${id}-${personId}`, token, headshot);
  return season === undefined ? title : portrait(`${media}-${id}-s${season}-${personId}`, token, title);
}
