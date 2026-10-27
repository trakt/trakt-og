import { createTtlCache } from '../utils/createTtlCache.ts';
import { type KeyedCache, sharedCache } from '../utils/sharedCache.ts';
import type { AboutMember } from './AboutMember.ts';
import { aboutTeamSchema } from './aboutTeamSchema.ts';
import { fetchAboutTeam } from './fetchAboutTeam.ts';
import { loadAboutGithub } from './github/loadAboutGithub.ts';
import { pickAboutTeam } from './pickAboutTeam.ts';

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;

// The team and their favorites change rarely, and reading them takes two calls a member, so each data center reads
// them twice a day and a worker holds its copy for an hour.
const TEAM_SECONDS = 12 * 60 * 60;
const teamCache = createTtlCache<AboutMember[]>({ ttlMs: HOUR_MS, retryMs: 5 * MINUTE_MS });

interface LoadAboutParams {
  fetch: typeof globalThis.fetch;
  now: number;
  /** `Math.random`, for each visit's shuffle of the team's favorites. */
  random: () => number;
  /** The data center's cache, `platform.caches.default`; without one each worker reads the team itself. */
  cache?: KeyedCache;
  /** The request's origin, which the shared cache's keys live under. */
  origin?: string;
  /** The streamed GitHub read uses a fetch without SvelteKit's completed-load dependency tracker. */
  liveFetch?: typeof globalThis.fetch;
  /** The `GITHUB_TOKEN` Worker secret, for GitHub's higher rate limit. */
  githubToken?: string;
  /** Tests pass a fresh cache; the page shares one per worker. */
  pool?: typeof teamCache;
}

/**
 * `/about`: the Trakt team with their favorites, and the repo's GitHub numbers, issues and commits streaming in after.
 * `today` is UTC, like GitHub's commit days. Nothing failing is an error; its section just stays out.
 */
export async function loadAbout({
  fetch,
  now,
  random,
  cache,
  origin = 'https://og.trakt.tv',
  liveFetch = fetch,
  githubToken,
  pool = teamCache,
}: LoadAboutParams) {
  const readTeam = () =>
    sharedCache({
      cache,
      ttlSeconds: TEAM_SECONDS,
      key: `${origin}/_cache/about/team`,
      parse: (value) => aboutTeamSchema.safeParse(value).data ?? null,
      load: () => fetchAboutTeam(fetch),
    });

  // Streamed, so a cache miss never holds up the page.
  const github = loadAboutGithub({ fetch: liveFetch, now, cache, origin, token: githubToken });

  const team = await pool({ now, load: readTeam }).catch((): AboutMember[] => []);

  return {
    team: pickAboutTeam({ team, random }),
    github,
    today: new Date(now).toISOString().slice(0, 10),
  };
}
