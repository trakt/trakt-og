import { SvelteMap } from 'svelte/reactivity';
import { fetchStudios, type StudioName } from './fetchStudios.ts';

type KeyValueStorage = Pick<Storage, 'getItem' | 'setItem'>;
type Saved = Record<string, { name: string; at: number }>;

const STORAGE_KEY = 'og-studio-names';
const KEEP_FOR = 30 * 60 * 1000;
const LOOKUP_LIMIT = 50;

const sessionStorageOrNull = (): KeyValueStorage | null => {
  try {
    return globalThis.sessionStorage ?? null;
  } catch {
    return null;
  }
};

/**
 * Studio names by slug, since the URL and the API only carry slugs. The browser keeps the names it has seen (search
 * results, a summary's studios) for half an hour in session storage, so a studio just picked or clicked shows its
 * name without asking again. The server keeps none: storage is null there, and only browser code remembers or resolves.
 */
export function studioNameCache(storage: KeyValueStorage | null = sessionStorageOrNull(), now = () => Date.now()) {
  const names = new SvelteMap<string, string>();
  // eslint-disable-next-line svelte/prefer-svelte-reactivity -- only stops repeat lookups, never read by the page
  const missed = new Set<string>();

  const saved = (): Saved => {
    try {
      const all: Saved = JSON.parse(storage?.getItem(STORAGE_KEY) ?? '{}') ?? {};
      return Object.fromEntries(Object.entries(all).filter(([, { at }]) => now() - at < KEEP_FOR));
    } catch {
      return {};
    }
  };

  const remember = (studios: readonly StudioName[]) => {
    if (studios.length === 0) return;
    const at = now();
    for (const { slug, name } of studios) names.set(slug, name);
    const fresh = Object.fromEntries(studios.map(({ slug, name }) => [slug, { name, at }]));
    try {
      storage?.setItem(STORAGE_KEY, JSON.stringify({ ...saved(), ...fresh }));
    } catch {
      // Full or blocked: the names still last the page.
    }
  };

  // Read once up front: a chip reads names inside a derived, where filling the map would throw.
  for (const [slug, { name }] of Object.entries(saved())) names.set(slug, name);

  return {
    name: (slug: string): string | undefined => names.get(slug),
    remember,
    /** Looks up each slug it has no name for, once a page load. One the search can't match keeps its fallback. */
    resolve: async (slugs: readonly string[], search = fetchStudios) => {
      const unknown = slugs.filter((slug, i) => slugs.indexOf(slug) === i && !names.has(slug) && !missed.has(slug));
      await Promise.all(
        unknown.map(async (slug) => {
          missed.add(slug);
          const found = await search(slug, LOOKUP_LIMIT).catch(() => []);
          remember(found.filter((studio) => studio.slug === slug));
        }),
      );
    },
  };
}

export const studioNames = studioNameCache();
