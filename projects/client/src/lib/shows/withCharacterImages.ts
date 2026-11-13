import { z } from 'zod/v4';

type CharacterImage = { readonly character_image?: string | null };

type Cast = readonly object[] | null | undefined;

type CastLists = { readonly cast?: Cast; readonly guest_stars?: Cast };

/** `T` with `character_image` on each cast and guest star entry. */
export type WithCharacterImages<T extends CastLists> = {
  [K in keyof T]: K extends 'cast' | 'guest_stars'
    ? NonNullable<T[K]> extends readonly (infer M)[]
      ? (M & CharacterImage)[] | Extract<T[K], null | undefined>
      : T[K]
    : T[K];
};

type Contract<T> = { safeParse: (body: unknown) => { success: boolean; data?: T } };

type Parsed<T> = { success: true; data: T } | { success: false };

const images = z
  .array(z.object({ character_image: z.string().nullish() }).loose())
  .nullish()
  .catch(null);

const imagesBody = z.object({ cast: images, guest_stars: images }).loose().catch({});

function withImages(members: Cast, raw: z.infer<typeof images>) {
  return members?.map((member, index) => ({ ...member, character_image: raw?.[index]?.character_image ?? null }));
}

/**
 * A `/people` contract that keeps each actor's `character_image`, which `@trakt/api` doesn't type yet. The contract
 * keeps the cast in the body's order, so each entry takes the image at its index.
 */
export function withCharacterImages<T extends CastLists>(contract: Contract<T>) {
  return {
    safeParse(body: unknown): Parsed<WithCharacterImages<T>> {
      const parsed = contract.safeParse(body);
      if (!parsed.success || parsed.data === undefined) return { success: false };
      const raw = imagesBody.parse(body);
      return {
        success: true,
        data: {
          ...parsed.data,
          cast: withImages(parsed.data.cast, raw.cast),
          guest_stars: withImages(parsed.data.guest_stars, raw.guest_stars),
        } as WithCharacterImages<T>,
      };
    },
  };
}
