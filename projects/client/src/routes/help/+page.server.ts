import { loadAboutGithub } from '../../lib/about/github/loadAboutGithub.ts';
import { pickHelpScene } from '../../lib/help/pickHelpScene.ts';
import type { KeyedCache } from '../../lib/utils/sharedCache.ts';

export const load = (event) => ({
  scene: pickHelpScene(Math.random),
  // Streamed, so GitHub never holds up the page.
  github: loadAboutGithub({
    fetch: globalThis.fetch,
    now: Date.now(),
    token: event.platform?.env.GITHUB_TOKEN,
    // The adapter types the cache with the Worker's own Response, which TypeScript can't match to the DOM's; at
    // runtime they're one class.
    cache: event.platform?.caches?.default as unknown as KeyedCache | undefined,
    origin: event.url.origin,
  }),
});
