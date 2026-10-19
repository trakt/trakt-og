import { getContext, setContext } from 'svelte';

const KEY = Symbol('gif-art');

/**
 * The fanart the GIF picker's header shows: a summary or comments page sets it once for every composer on it, reply
 * boxes included, and the picker reads it. Without one, the header shows Klipy's category previews.
 */
export const gifArtContext = {
  set: (fanart: () => string | undefined) => setContext(KEY, fanart),
  get: () => getContext<(() => string | undefined) | undefined>(KEY),
};
