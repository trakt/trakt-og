<!--
  The comment composer's GIF picker, a dialog of Klipy's GIFs: a search field, Klipy's categories as shortcuts until
  something's typed, and what's trending or the search's results in columns that load more as they scroll. Picking
  one closes it. Nothing loads until it first opens, and a page that fails to load can be tried again.
-->
<script lang="ts">
import { untrack } from 'svelte';
import { nearViewport } from '../../../utils/nearViewport.ts';
import Dialog from '../../dialog/Dialog.svelte';
import SearchField from '../../filters/SearchField.svelte';
import { fetchGifCategories } from './fetchGifCategories.ts';
import { fetchGifs } from './fetchGifs.ts';
import type { GifCategory } from './GifCategory.ts';
import type { GifEntry } from './GifEntry.ts';
import GifTile from './GifTile.svelte';
import { klipyCustomerId } from './klipyCustomerId.ts';
import { toGifColumns } from './toGifColumns.ts';

// A screenful plus headroom, so the scroll sentinel always has more to fetch.
const PAGE_SIZE = 24;
const SEARCH_DELAY = 250;
const COLUMNS = 3;

interface Props {
  open: boolean;
  onselect: (gif: GifEntry) => void;
}

let { open = $bindable(), onselect }: Props = $props();

let search = $state('');
let term = $state('');
let categories = $state<readonly GifCategory[]>([]);
let gifs = $state<readonly GifEntry[]>([]);
let page = $state(0);
let hasNext = $state(true);
let loading = $state(false);
let failed = $state(false);
// Bumped for each new term, so a page that lands late for the old one is dropped.
let generation = 0;
// The term the results are for, unset until the picker first opens.
let shown: string | undefined;
const columns = $derived(toGifColumns(gifs, COLUMNS));

$effect(() => {
  const next = search.trim();
  const timer = setTimeout(() => (term = next), SEARCH_DELAY);
  return () => clearTimeout(timer);
});

$effect(() => {
  const next = term;
  if (!open || next === shown) return;
  untrack(() => {
    if (shown === undefined) {
      void fetchGifCategories({ customerId: klipyCustomerId() }).then((loaded) => (categories = loaded));
    }
    shown = next;
    generation++;
    gifs = [];
    page = 0;
    hasNext = true;
    loading = false;
    failed = false;
    void more();
  });
});

async function more() {
  if (loading || !hasNext) return;
  const mine = generation;
  loading = true;
  try {
    const next = await fetchGifs({ query: term, page: page + 1, limit: PAGE_SIZE, customerId: klipyCustomerId() });
    if (mine !== generation) return;
    const seen = new Set(gifs.map(({ id }) => id));
    gifs = [...gifs, ...next.entries.filter(({ id }) => !seen.has(id))];
    page++;
    hasNext = next.hasNext;
  } catch {
    if (mine === generation) failed = true;
  } finally {
    if (mine === generation) loading = false;
  }
}

function retry() {
  failed = false;
  void more();
}

function pick(gif: GifEntry) {
  open = false;
  onselect(gif);
}
</script>

<Dialog bind:open title="Add a GIF" size="lg" lightDismiss>
  <div class="picker">
    <SearchField label="Search GIFs" placeholder="Search KLIPY" bind:value={search} />
    {#if !term && categories.length > 0}
      <div class="categories">
        {#each categories as category (category.query)}
          <button type="button" class="category" onclick={() => (search = category.query)}>
            <img src={category.previewUrl} alt="" loading="lazy" decoding="async" />
            <span>{category.title}</span>
          </button>
        {/each}
      </div>
    {/if}
    <div class="results" aria-busy={loading}>
      {#if gifs.length > 0}
        <div class="grid">
          {#each columns as column, index (index)}
            <div class="column">
              {#each column as gif (gif.id)}<GifTile {gif} onselect={() => pick(gif)} />{/each}
            </div>
          {/each}
        </div>
      {/if}
      {#if failed}
        <p class="note">GIFs couldn't be loaded. <button type="button" onclick={retry}>Try again</button></p>
      {:else if gifs.length > 0 && hasNext}
        <!-- It fires once, so each page gets its own. -->
        {#key page}<div class="sentinel" {@attach nearViewport(() => void more())}></div>{/key}
      {:else if gifs.length === 0 && !loading}
        <p class="note">No GIFs found.</p>
      {/if}
    </div>
  </div>
</Dialog>

<style>
.picker {
  display: grid;
  gap: var(--gif-picker-gap);
}

.categories {
  display: flex;
  gap: var(--gif-picker-tile-gap);
  overflow-x: auto;
  scrollbar-width: none;
}

.category {
  display: flex;
  position: relative;
  flex: none;
  align-items: flex-end;
  inline-size: var(--gif-category-width);
  block-size: var(--gif-category-height);
  padding: var(--gif-category-padding);
  overflow: hidden;
  border: 0;
  border-radius: var(--radius-comment-gif);
  background-color: var(--color-comment-chip);
  cursor: pointer;

  & img {
    position: absolute;
    inset: 0;
    inline-size: 100%;
    block-size: 100%;
    object-fit: cover;
  }

  /* Always on a GIF, never on the page, so it's light in both themes. */
  & span {
    position: relative;
    color: var(--color-gif-on-image);
    font-weight: var(--font-weight-headings);
    text-shadow: var(--gif-category-text-shadow);
    text-transform: capitalize;
  }

  &:hover,
  &:focus-visible {
    outline: var(--focus-ring-width) solid var(--color-input-border-focus);
    outline-offset: calc(-1 * var(--focus-ring-width));
  }
}

.results {
  block-size: var(--gif-picker-results-height);
  overflow-y: auto;
}

.grid {
  display: flex;
  align-items: flex-start;
  gap: var(--gif-picker-tile-gap);
}

.column {
  display: grid;
  flex: 1 1 0;
  gap: var(--gif-picker-tile-gap);
  min-inline-size: 0;
}

.sentinel {
  block-size: 1px;
}

.note {
  margin: 0;
  color: var(--color-comment-muted);
}
</style>
