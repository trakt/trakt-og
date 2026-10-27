import { createTtlCache } from '../../utils/createTtlCache.ts';
import { type KeyedCache, sharedCache } from '../../utils/sharedCache.ts';
import { aboutGithubSchema } from './aboutGithubSchema.ts';
import { type AboutGithub, fetchAboutGithub } from './fetchAboutGithub.ts';

const MINUTE_MS = 60 * 1000;
// GitHub allows an address 60 reads an hour without a token, so the repo's numbers, issues and commits are read once
// per data center every 10 minutes and shared by all its workers (and the about and help pages), which each hold a
// copy for a minute more.
const GITHUB_SECONDS = 10 * 60;
const githubCache = createTtlCache<AboutGithub>({ ttlMs: MINUTE_MS, retryMs: MINUTE_MS });

interface LoadAboutGithubParams {
  /** A fetch without SvelteKit's completed-load dependency tracker, since the read streams in after the page. */
  fetch: typeof globalThis.fetch;
  now: number;
  /** The data center's cache, `platform.caches.default`. */
  cache?: KeyedCache;
  /** The request's origin, which the shared cache's keys live under. */
  origin: string;
  /** The `GITHUB_TOKEN` Worker secret, for GitHub's higher rate limit. */
  token?: string;
  /** Tests pass a fresh cache; the pages share one per worker. */
  pool?: typeof githubCache;
}

/**
 * The repo's GitHub numbers, issues and commits, for a page to stream in. Never rejects: null when GitHub can't be read
 * and nothing's cached.
 */
export function loadAboutGithub({ fetch, now, cache, origin, token, pool = githubCache }: LoadAboutGithubParams) {
  const read = () =>
    sharedCache({
      cache,
      ttlSeconds: GITHUB_SECONDS,
      key: `${origin}/_cache/about/github`,
      parse: (value) => aboutGithubSchema.safeParse(value).data ?? null,
      load: () => fetchAboutGithub({ fetch, token }),
    });

  return pool({ now, load: read }).catch((reason: unknown) => {
    console.warn('GitHub could not be read', reason);
    return null;
  });
}
