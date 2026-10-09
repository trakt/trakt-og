<!--
  The slide-in filter panel of a SidebarFrame page: og's whole advanced set with nothing to apply. Every change
  filters the page straight away (typing and sliders after a short pause): streaming services, terms, then each list as
  a full-width field that keeps (⊕) and leaves out (⊖) values, then the runtime and the site ratings. Reset and Close
  sit at the top. OG kept filtering for VIPs, so everyone else sees the fields locked under the VIP link. The lists load
  from the API the first time it opens; Esc closes it.
    <FiltersPanel id="calendar-filters" {open} {config} {filters} {vip} {country} {favorites} {sources}
      onchange={(filters) => goto(…)} onclose={close} />
-->
<script lang="ts">
import { on } from 'svelte/events';
import imdbLogo from '$lib/assets/sites/imdb-clean.png';
import rtAudience from '$lib/assets/sites/rt/audience-upright.svg';
import rtFresh from '$lib/assets/sites/rt/tomatometer-fresh.svg';
import traktLogo from '$lib/assets/sites/trakt.png';
import Tooltip from '$lib/components/tooltip/Tooltip.svelte';
import Icon from '$lib/icons/Icon.svelte';
import searchIcon from '$lib/icons/light/magnifying-glass.svg?raw';
import resetIcon from '$lib/icons/regular/arrow-rotate-left.svg?raw';
import xmark from '$lib/icons/regular/xmark.svg?raw';
import { traktUrls } from '$lib/traktUrls';
import type { AdvancedFiltersConfig } from './AdvancedFiltersConfig.ts';
import { type AdvancedFilters, emptyFilters, type ListFilterKey, type RangeFilterKey } from './advancedFilters.ts';
import { fetchFilterBody } from './fetchFilterBody.ts';
import { fetchListOptions } from './fetchListOptions.ts';
import { type FilterDraft, fromFilterDraft, toFilterDraft } from './filterDraft.ts';
import type { FilterOption } from './filterOptions.ts';
import { filterValueLabel } from './filterTags.ts';
import IncludeExcludeSelect from './IncludeExcludeSelect.svelte';
import { type ListSelection, listSelection, toListFilter } from './listSelection.ts';
import RangeSlider from './RangeSlider.svelte';
import { type FilterSource, toFilterSources, watchNowOptions } from './watchNowFilter.ts';

interface Props {
  id: string;
  open: boolean;
  config: AdvancedFiltersConfig;
  /** The filters in the URL. */
  filters: AdvancedFilters;
  vip: boolean;
  /** The viewer's watch-now country and favorite services there (bare slugs). */
  country: string;
  favorites: readonly string[];
  /** The picked services, which the loader fetched: names for the field until the list loads. */
  sources?: ReadonlyMap<string, FilterSource>;
  onchange: (filters: AdvancedFilters) => void;
  /** Close and Esc: the page closes the panel and puts focus back on the funnel. */
  onclose: () => void;
}

const { id, open, config, filters, vip, country, favorites, sources, onchange, onclose }: Props = $props();

const lists = {
  genres: 'Genres',
  certifications: 'Certifications',
  languages: 'Languages',
  countries: 'Countries',
  networks: 'Networks',
  episode_types: 'Episode Types',
  status: 'Status',
} satisfies Record<ListFilterKey, string>;

const ratingRows = {
  ratings: { site: 'Trakt', logo: traktLogo, format: (v: number) => `${v}%` },
  imdb_ratings: { site: 'IMDb', logo: imdbLogo, format: (v: number) => v.toFixed(1) },
  rt_meters: { site: 'Rotten Tomatoes', metric: 'Tomatometer', logo: rtFresh, format: (v: number) => `${v}%` },
  rt_user_meters: {
    site: 'Rotten Tomatoes',
    metric: 'Audience Score',
    logo: rtAudience,
    format: (v: number) => `${v}%`,
  },
} as const;
const isRating = (key: RangeFilterKey): key is keyof typeof ratingRows => Object.hasOwn(ratingRows, key);
const ratings = $derived(config.ranges.filter(isRating));

// The fields start from the URL's filters, and start over whenever those change.
let draft = $derived<FilterDraft>(toFilterDraft(filters, config));
let timer: ReturnType<typeof setTimeout> | undefined;

function apply(next: FilterDraft, wait = 0) {
  draft = next;
  if (!vip) return;
  clearTimeout(timer);
  timer = setTimeout(() => onchange(fromFilterDraft(next, config)), wait);
}

const setList = (key: ListFilterKey, selection: ListSelection) =>
  apply({ ...draft, [key]: toListFilter(selection, draft[key].mode) });
const setRange = (key: RangeFilterKey, range: readonly [number, number]) =>
  apply({ ...draft, ranges: { ...draft.ranges, [key]: range } }, 400);

// The lists load once, the first time the panel opens.
let options = $state<Partial<Record<ListFilterKey, FilterOption[]>>>({});
let loadedSources = $state<ReadonlyMap<string, FilterSource>>();
let requestedKey = '';

$effect(() => {
  if (!open) return;
  const requestKey = JSON.stringify([config.type, config.optionTypes, config.lists, config.watchnow, country]);
  if (requestedKey === requestKey) return;
  requestedKey = requestKey;
  options = {};
  loadedSources = undefined;
  for (const key of config.lists) {
    fetchListOptions(key, config)
      .then((list) => {
        if (requestedKey === requestKey) options = { ...options, [key]: list };
      })
      .catch(() => {
        if (requestedKey === requestKey) options = { ...options, [key]: [] };
      });
  }
  if (config.watchnow) {
    fetchFilterBody(`/watchnow/sources/${country}`)
      .then((body) => {
        if (requestedKey === requestKey) loadedSources = toFilterSources(body, country);
      })
      .catch(() => {
        if (requestedKey === requestKey) loadedSources = new Map();
      });
  }
});

const watchnowGroups = $derived(
  watchNowOptions({ sources: loadedSources ?? new Map(), country, favorites: vip ? favorites : [] }),
);
const sourceName = (slug: string) =>
  slug === 'favorites' ? 'All Favorites' : (loadedSources ?? sources)?.get(slug)?.name ?? slug;

let panel = $state<HTMLElement>();

// Opening moves focus into the panel, like a disclosure's content.
$effect(() => {
  if (open) panel?.querySelector<HTMLElement>('.header button')?.focus({ preventScroll: true });
});

function onkeydown(event: KeyboardEvent) {
  if (event.key !== 'Escape' || event.defaultPrevented) return;
  event.preventDefault();
  onclose();
}

function reset() {
  apply(toFilterDraft(emptyFilters, config));
}
</script>

<!-- The VIP page is an OG route og hasn't built yet, and resolve() only takes routes that exist. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->

<section {id} class={['filters-panel', { open }]} aria-labelledby="{id}-title" inert={!open} bind:this={panel}
  {@attach (node) => on(node, 'keydown', onkeydown)}>
  <div class="inner">
    <div class="header">
      <h2 id="{id}-title">Filters</h2>
      <button type="button" class="text-button" onclick={reset} disabled={!vip}><Icon svg={resetIcon} />Reset</button>
      <button type="button" class="text-button" onclick={onclose}><Icon svg={xmark} />Close</button>
    </div>

    {#if !vip}
      <a class="unlock" href={traktUrls.vip} target="_blank" rel="noopener">Filters are a VIP feature. Unlock them
        with VIP</a>
    {/if}

    {#if config.watchnow}
      <IncludeExcludeSelect label="Streaming" groups={watchnowGroups} excludable={false} disabled={!vip}
        loading={!loadedSources} labelFor={sourceName} selection={{ include: draft.watchnow, exclude: [] }}
        onchange={({ include }) => apply({ ...draft, watchnow: include })} />
    {/if}

    {#if config.query}
      <label class="terms">
        <Icon svg={searchIcon} />
        <input type="search" aria-label="Filter by titles and descriptions" placeholder="Filter by titles and descriptions..."
          disabled={!vip} value={draft.query} oninput={(event) => apply({ ...draft, query: event.currentTarget.value }, 400)} />
      </label>
    {/if}

    {#each config.lists as key (key)}
      <IncludeExcludeSelect label={lists[key]} groups={[{ options: options[key] ?? [] }]} loading={!options[key]}
        disabled={!vip} labelFor={(value) => filterValueLabel(key, value)} selection={listSelection(draft[key])}
        onchange={(selection) => setList(key, selection)} />
    {/each}

    {#if config.ranges.includes('years')}
      {@const [min, max] = draft.ranges.years}
      <p class="label">Released in <b>{min}</b> to <b>{max}</b></p>
      <RangeSlider scale={config.scales.years} label="Released"
        bind:value={() => draft.ranges.years, (range) => setRange('years', range)} />
    {/if}

    {#if config.ranges.includes('runtimes')}
      {@const [min, max] = draft.ranges.runtimes}
      <p class="label">Runtime of <b>{min}</b> to <b>{max}</b> minutes</p>
      <RangeSlider scale={config.scales.runtimes} label="Runtime"
        bind:value={() => draft.ranges.runtimes, (range) => setRange('runtimes', range)} />
    {/if}

    {#if ratings.length > 0}
      <p class="label">Site Ratings</p>
      {#each ratings as key (key)}
        {@const row = ratingRows[key]}
        {@const metric = 'metric' in row ? row.metric : undefined}
        <div class="rating">
          <Tooltip placement="left">
            {#snippet trigger(tooltip)}<span class="site" {...tooltip}><img src={row.logo} alt="" /></span>{/snippet}
            {row.site}{#if metric}<br /><em class="metric">{metric}</em>{/if}
          </Tooltip>
          <RangeSlider labeled scale={config.scales[key]} label="{row.site}{metric ? ` ${metric}` : ''} rating"
            format={row.format} bind:value={() => draft.ranges[key], (range) => setRange(key, range)} />
        </div>
      {/each}
    {/if}
  </div>
</section>

<style>
/* A column that opens from nothing between the sidebar and the content (the SidebarFrame gives it its track). */
.filters-panel {
  min-block-size: 100vh;
  overflow: clip;
  background-color: var(--color-filter-panel-bg);
  opacity: 0;

  &.open {
    opacity: 1;
  }

  @media (prefers-reduced-motion: no-preference) {
    transition: opacity var(--transition-frame);
  }

  @media (max-width: 767px) {
    min-block-size: 0;

    &:not(.open) {
      display: none;
    }
  }
}

.inner {
  position: sticky;
  inset-block-start: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-base-inline);
  inline-size: var(--sidebar-panel-width);
  block-size: 100vh;
  padding: calc(var(--header-height) + var(--space-lg-inline)) var(--sidebar-padding) var(--sidebar-padding);
  overflow-y: auto;
  scrollbar-width: thin;
  color: var(--color-frame-text);

  @media (max-width: 767px) {
    position: static;
    inline-size: auto;
    block-size: auto;
    padding-block-start: 0;
  }
}

.header {
  display: flex;
  align-items: center;
  gap: var(--space-xs-inline);

  & h2 {
    flex: 1;
    margin: 0;
    font-size: var(--font-size-icon-lg);
    font-weight: var(--font-weight-headings-heavy);
  }
}

.text-button {
  display: inline-flex;
  align-items: center;
  gap: var(--space-base-block);
  min-block-size: var(--control-height-small);
  padding: 0 var(--space-sm-inline);
  border: 0;
  border-radius: var(--radius-control);
  background: none;
  color: var(--color-sidebar-pill-text);
  font: inherit;
  font-size: var(--font-size-small);
  font-weight: var(--font-weight-menu-header);
  cursor: pointer;

  &:is(:hover, :focus-visible):not(:disabled) {
    background-color: var(--color-tool-hover-bg);
    color: var(--color-frame-text);
  }

  &:disabled {
    cursor: default;
    opacity: 0.4;
  }
}

.unlock {
  padding: var(--space-sm-inline);
  border: 1px solid var(--color-sidebar-pill-set-border);
  border-radius: var(--radius-control);
  background-color: var(--color-sidebar-pill-set-bg);
  color: var(--color-sidebar-pill-set-text);
  font-size: var(--font-size-small);
  text-decoration: none;

  &:is(:hover, :focus-visible) {
    color: var(--color-frame-text);
  }
}

.terms {
  display: flex;
  align-items: center;
  gap: var(--space-base-block);
  padding: 0 var(--space-sm-inline);
  border: 1px solid var(--color-control-border);
  border-radius: var(--radius-control);
  background-color: var(--color-control-bg);
  color: var(--color-control-muted);

  &:focus-within {
    border-color: var(--color-input-border-focus);
  }

  & input {
    flex: 1;
    min-inline-size: 0;
    block-size: calc(var(--control-height) - 2px);
    border: 0;
    background: none;
    box-shadow: none;
    color: var(--color-control-text);
    font: inherit;
    font-size: var(--font-size-control);

    &:focus-visible {
      outline: 0;
    }
  }
}

.label {
  margin: var(--space-base-block) 0 0;
  color: var(--color-sidebar-label);
  font-size: var(--font-size-sidebar-section);
  font-weight: var(--font-weight-menu-header);
  letter-spacing: var(--letter-spacing-sidebar-label);
  text-transform: uppercase;

  & b {
    color: var(--color-frame-text);
  }
}

.rating {
  display: grid;
  grid-template-columns: var(--filter-site-width) minmax(0, 1fr);
  align-items: center;
  column-gap: var(--filter-rating-site-gap);

  & img {
    display: block;
    inline-size: var(--filter-site-width);
  }
}

.metric {
  color: var(--color-tooltip-muted);
}
</style>
