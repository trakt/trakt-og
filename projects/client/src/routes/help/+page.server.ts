import { env } from 'cloudflare:workers';
import { loadAboutGithub } from '../../lib/about/github/loadAboutGithub.ts';
import { pickHelpScene } from '../../lib/help/pickHelpScene.ts';
import { edgeCache } from '../../lib/utils/edgeCache.ts';

export const load = (event) => ({
  scene: pickHelpScene(Math.random),
  // Streamed, so GitHub never holds up the page.
  github: loadAboutGithub({
    fetch: globalThis.fetch,
    now: Date.now(),
    token: env.GITHUB_TOKEN,
    cache: edgeCache(),
    origin: event.url.origin,
  }),
});
