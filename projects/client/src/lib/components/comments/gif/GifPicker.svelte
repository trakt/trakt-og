<!--
  The comment composer's GIF picker, in the list and note dialogs' art style: a header strip of Klipy's category
  previews (or the page's fanart) under the dark glass shade with "Add a GIF" over it and the glass close in its corner, then a search field, Klipy's categories as shortcuts until
  something's typed, and GIFs for the title the comment's about (or what's trending), then the search's results in columns that load more as they scroll. Picking
  one closes it. Nothing loads until it first opens, and a page that fails to load can be tried again. Shimmering
  category and GIF tiles hold their places while they load, and one more sits at the foot of each column while the
  next page does.
-->
<script lang="ts">
import { untrack } from 'svelte';
import { nearViewport } from '../../../utils/nearViewport.ts';
import Dialog from '../../dialog/Dialog.svelte';
import DialogArtHeader from '../../dialog/DialogArtHeader.svelte';
import { gifArtContext } from './gifArtContext.ts';
import SearchField from '../../filters/SearchField.svelte';
import { fetchGifCategories } from './fetchGifCategories.ts';
import { fetchGifs } from './fetchGifs.ts';
import type { GifCategory } from './GifCategory.ts';
import type { GifEntry } from './GifEntry.ts';
import GifTile from './GifTile.svelte';
import Shimmer from '../../loading/Shimmer.svelte';
import { klipyCustomerId } from './klipyCustomerId.ts';
import { toGifColumns } from './toGifColumns.ts';

// A screenful plus headroom, so the scroll sentinel always has more to fetch.
const PAGE_SIZE = 24;
const SEARCH_DELAY = 250;
const COLUMNS = 3;
// The header strip's previews.
const HEADER_PREVIEWS = 6;
// Placeholder tiles: enough to fill the strip and the results, in GIF-like shapes staggered down the columns.
const CATEGORY_SHIMMERS = 6;
const RESULT_SHIMMER_ROWS = 4;
const SHIMMER_SHAPES = ['wide', 'square', 'tall'] as const;

interface Props {
  open: boolean;
  onselect: (gif: GifEntry) => void;
  /** What shows before anything's typed, like the title the comment is about. Left out, it's what's trending. */
  initialQuery?: string;
}

let { open = $bindable(), onselect, initialQuery = '' }: Props = $props();
const fanart = gifArtContext.get();

let search = $state('');
let term = $state('');
// Null until they load.
let categories = $state<readonly GifCategory[] | null>(null);
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
const previews = $derived((categories ?? []).slice(0, HEADER_PREVIEWS).map(({ previewUrl }) => previewUrl));
// The field stays empty; until something's typed the results are the initial query's.
const query = $derived(term || initialQuery);

$effect(() => {
  const next = search.trim();
  const timer = setTimeout(() => (term = next), SEARCH_DELAY);
  return () => clearTimeout(timer);
});

$effect(() => {
  const next = query;
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
    const next = await fetchGifs({ query, page: page + 1, limit: PAGE_SIZE, customerId: klipyCustomerId() });
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

<!-- A GIF's place, its shape staggered across the columns and down them. -->
{#snippet shimmer(column: number, row: number)}
  <span class={['tile-shimmer', SHIMMER_SHAPES.at((column + row) % SHIMMER_SHAPES.length)]} aria-hidden="true">
    <Shimmer inline="100%" block="100%" />
  </span>
{/snippet}

<Dialog bind:open title="Add a GIF" size="lg" variant="art" lightDismiss>
  {#snippet header(titleId)}<DialogArtHeader id={titleId} title="Add a GIF" fanart={fanart?.()} posters={previews} />{/snippet}
  <div class="picker">
    <SearchField label="Search GIFs" placeholder="Search KLIPY" bind:value={search} />
    {#if !term && categories === null}
      <div class="categories" aria-hidden="true">
        {#each { length: CATEGORY_SHIMMERS } as _, i (i)}
          <span class="category-shimmer"><Shimmer inline="100%" block="100%" /></span>
        {/each}
      </div>
    {:else if !term && categories?.length}
      <div class="categories">
        {#each categories as category (category.query)}
          <button type="button" class="category" onclick={() => (search = category.query)}>
            <img src={category.previewUrl} alt="" loading="lazy" decoding="async" />
            <span>{category.title}</span>
          </button>
        {/each}
      </div>
    {/if}
    <div class={['results', { first: loading && gifs.length === 0 }]} aria-busy={loading}>
      {#if gifs.length > 0}
        <div class="grid">
          {#each columns as column, index (index)}
            <div class="column">
              {#each column as gif (gif.id)}<GifTile {gif} onselect={() => pick(gif)} />{/each}
              {#if loading}{@render shimmer(index, column.length)}{/if}
            </div>
          {/each}
        </div>
      {:else if loading}
        <div class="grid">
          {#each { length: COLUMNS } as _, column (column)}
            <div class="column">
              {#each { length: RESULT_SHIMMER_ROWS } as _, row (row)}{@render shimmer(column, row)}{/each}
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
  padding: var(--dialog-art-body-top) var(--dialog-art-inline);
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

.category-shimmer {
  display: flex;
  flex: none;
  inline-size: var(--gif-category-width);
  block-size: var(--gif-category-height);
}

.results {
  block-size: var(--gif-picker-results-height);
  overflow-y: auto;

  /* The first page's shimmers fill it without a scrollbar. */
  &.first {
    overflow-y: hidden;
  }
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

.tile-shimmer {
  display: flex;
  aspect-ratio: var(--ratio-gif-shimmer-square);

  &.wide {
    aspect-ratio: var(--ratio-gif-shimmer-wide);
  }

  &.tall {
    aspect-ratio: var(--ratio-gif-shimmer-tall);
  }
}

.sentinel {
  block-size: 1px;
}

.note {
  margin: 0;
  color: var(--color-comment-muted);
}
</style>
