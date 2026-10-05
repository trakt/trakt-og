import { z } from 'zod/v4';

const choice = <T extends string>(values: readonly T[], fallback: T) =>
  z.enum(values).catch(fallback).nullish().transform((value) => value ?? fallback);
const defaults = <T extends z.ZodType>(schema: T) => schema.nullish().transform((value) => schema.parse(value ?? {}));
const mostWatched = (fallback: 'plays' | 'time') =>
  defaults(z.object({
    sort_by: choice(['plays', 'time'], fallback),
    tab: choice(['last_30_days', 'all_time'], 'last_30_days'),
  }));
const schema = z.object({
  profile: defaults(z.object({
    favorites: defaults(
      z.object({
        sort_by: z.string().nullish().transform((value) => value || 'random'),
        sort_how: choice(['asc', 'desc'], 'asc'),
      }),
    ),
    most_watched_shows: mostWatched('plays'),
    most_watched_movies: mostWatched('time'),
  })),
});
const response = z.object({ browsing: z.unknown().nullish() });

/** Parses the profile's saved panel preferences (favorites sort, Most Watched tabs) from API's browsing settings. */
export function toPanelSettings(settings: unknown) {
  const parsed = response.safeParse(settings);
  const result = schema.safeParse((parsed.success ? parsed.data.browsing : null) ?? {});
  return result.success ? result.data : schema.parse({});
}
