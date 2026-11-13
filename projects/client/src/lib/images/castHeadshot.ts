import { imageUrl } from '../utils/imageUrl.ts';
import { mediaImage, withFallback } from './mediaImage.ts';

type CastMember = {
  readonly person: { readonly ids: { readonly trakt: number } };
  /** A show's photo of the actor in character, as an `extended=images` medium path. Null when there is none. */
  readonly character_image?: string | null;
};

/**
 * A cast card's thumb: the actor in character on this show when the API has that photo, falling back to their
 * headshot, then to the card's placeholder. Everyone else gets their headshot.
 */
export function castHeadshot({ person, character_image }: CastMember): string {
  const headshot = mediaImage({ type: 'person', id: person.ids.trakt, slot: 'headshot', size: 'thumb' });
  const character = imageUrl(character_image, 'thumb');
  return character ? withFallback(character, headshot) : headshot;
}
