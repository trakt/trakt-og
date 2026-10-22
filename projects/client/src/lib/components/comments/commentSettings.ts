import { z } from 'zod/v4';

// `/users/settings` comes from the API, so the two fields comments read are parsed here.
const schema = z.object({
  browsing: z.object({
    spoilers: z.object({ comments: z.string().nullish() }).nullish(),
    comments: z.object({ blocked_uids: z.array(z.number().int()) }).nullish(),
  }),
});

export type CommentSettings = {
  /** `browsing.spoilers.comments` is `hide`: every comment is blurred until clicked. */
  readonly hideSpoilers: boolean;
  /** The members whose comments the viewer blocked. */
  readonly blocked: ReadonlySet<number>;
};

function read(settings: unknown): CommentSettings {
  const parsed = schema.safeParse(settings);
  const browsing = parsed.success ? parsed.data.browsing : undefined;
  return {
    hideSpoilers: browsing?.spoilers?.comments === 'hide',
    blocked: new Set(browsing?.comments?.blocked_uids ?? []),
  };
}

// Every comment card asks, so one parse per settings object serves a whole page. Load data is replaced, never mutated.
const cache = new WeakMap<object, CommentSettings>();

/** The viewer's comment settings from the layout's `/users/settings`. Logged out, or an unexpected shape, is none. */
export function commentSettings(settings: unknown): CommentSettings {
  if (typeof settings !== 'object' || settings === null) return read(settings);
  const cached = cache.get(settings);
  if (cached) return cached;
  const result = read(settings);
  cache.set(settings, result);
  return result;
}
