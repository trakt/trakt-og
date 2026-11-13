import { peopleResponseSchema } from '@trakt/api';
import { describe, expect, it } from 'vitest';
import { withCharacterImages } from './withCharacterImages.ts';

const actor = (trakt: number, characterImage?: string | null) => ({
  person: { name: `Actor ${trakt}`, ids: { slug: `actor-${trakt}`, trakt } },
  character: 'Someone',
  characters: ['Someone'],
  ...(characterImage === undefined ? {} : { character_image: characterImage }),
});

const image = (person: number) => `media.trakt.tv/characters/1388-${person}/medium/headshot.webp`;

describe('util: withCharacterImages', () => {
  const schema = withCharacterImages(peopleResponseSchema);

  it("should keep each actor's character image, which the contract strips", () => {
    const parsed = schema.safeParse({
      cast: [actor(1, image(1)), actor(2, null), actor(3)],
      guest_stars: [actor(4, image(4))],
    });

    expect(parsed.success && parsed.data.cast?.map((member) => member.character_image)).toEqual([image(1), null, null]);
    expect(parsed.success && parsed.data.guest_stars?.[0]?.character_image).toBe(image(4));
  });

  it('should keep the contract fields', () => {
    const parsed = schema.safeParse({ cast: [actor(1, image(1))] });

    expect(parsed.success && parsed.data.cast?.[0]?.person.ids.slug).toBe('actor-1');
  });

  it('should fail when the contract fails', () => {
    expect(schema.safeParse({ cast: [{ character_image: image(1) }] }).success).toBe(false);
  });
});
