/** A title the member tracked from a starter pick, with the poster to show for it on their reel. */
export type TrackedPoster = { readonly key: string; readonly title: string; readonly image?: string };

let posters = $state<readonly TrackedPoster[]>([]);

/**
 * The starter picks tracked so far on this page, oldest first, so the first-night reel can show their posters. Titles
 * tracked anywhere else still count on the reel, as plain frames.
 */
export const trackedPosters = {
  get list() {
    return posters;
  },
  remember(poster: TrackedPoster) {
    if (!posters.some(({ key }) => key === poster.key)) posters = [...posters, poster];
  },
  forget(key: string) {
    if (posters.some((poster) => poster.key === key)) posters = posters.filter((poster) => poster.key !== key);
  },
};
