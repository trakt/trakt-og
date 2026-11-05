import { loadAbout } from '../../lib/about/loadAbout.ts';
import { env } from 'cloudflare:workers';
import { edgeCache } from '../../lib/utils/edgeCache.ts';

export const load = (event) =>
  loadAbout({
    fetch: event.fetch,
    now: Date.now(),
    random: Math.random,
    liveFetch: globalThis.fetch,
    githubToken: env.GITHUB_TOKEN,
    cache: edgeCache(),
    origin: event.url.origin,
  });
