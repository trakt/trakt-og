import { page } from '$app/state';
import { overlay } from '../../../lib/overlay/overlay.ts';
import type { DemoLibrary } from './library.ts';

const NAMES = ['watchedMovies', 'watchedShows', 'watchlist', 'ratings', 'network'] as const;

/**
 * Holds a made-up library in the app's overlay while a demo is open, so the getting-started pill, the first-night reel
 * and the nudges have something to count. Only for a signed-out viewer, whose overlay is empty anyway: signed in, they
 * count your own library. Call it while a component starts; `library` returning null takes the library back out.
 */
export function seedOverlay(library: () => DemoLibrary | null) {
  const seed = $derived(page.data.user ? null : library());
  const seeding = $derived(seed !== null);

  // The layout's sign-out check empties the overlay once the page has loaded, so a missing slice is put back.
  $effect(() => {
    if (!seed) return;
    const slices = overlay.slices();
    NAMES.filter((name) => slices[name] !== seed[name])
      .forEach((name) => overlay.patch(name, () => seed[name], seed[name]));
  });

  $effect(() => {
    if (!seeding) return;
    return () => void overlay.stop();
  });
}
