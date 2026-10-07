<!--
  OG's Watch Now picker: a play icon, red while services are applied, that opens a small panel with a service
  search and your favorites and every service as checkable rows, each with its logo tile. Apply reloads with
  `watchnow=` (the slugs, comma separated), which the worker's `sources` reads, and the × drops them.
  `placeholder` is OG's All Types state: the icon only asks for a type first.
  The services load on first open, from `/watchnow/sources/:country`.
    <WatchNowFilter value={filters.watchnow} {country} favorites={settings?.browsing?.watchnow?.favorites ?? []} />
-->
<script lang="ts">
import { goto } from '$app/navigation';
import { page } from '$app/state';
import FilterPopover from '$lib/components/filters/FilterPopover.svelte';
import { serviceLabel } from '$lib/components/filters/serviceLabel';
import Icon from '$lib/icons/Icon.svelte';
import play from '$lib/icons/regular/play.svg?raw';
import heart from '$lib/icons/regular/heart.svg?raw';
import search from '$lib/icons/regular/magnifying-glass.svg?raw';
import check from '$lib/icons/trakt/check-thick.svg?raw';
import { api } from '../../api/api.ts';
import { favoriteSlugs, type Source, toSourceMap } from './watchNow.ts';

interface Props {
  /** The applied `watchnow` list. */
  value?: string;
  /** The viewer's watch-now country, lower case. */
  country: string;
  /** Their favorite services as API stores them (`us-netflix`). */
  favorites?: readonly string[];
  placeholder?: boolean;
}

const { value = '', country, favorites = [], placeholder = false }: Props = $props();
let sources = $state<Map<string, Source> | null>(null);
let picked = $state<string[]>([]);
let query = $state('');

const applied = $derived(value.split(',').map((slug) => slug.trim()).filter(Boolean));
const favoriteSet = $derived(new Set(favoriteSlugs(favorites, country, country)));
const matches = (name: string) => name.toLowerCase().includes(query.trim().toLowerCase());
const groups = $derived.by(() => {
  const all = [...(sources ?? [])].map(([slug, source]) => ({ slug, ...source, ...serviceLabel(source.name) }));
  const mine = all.filter(({ slug }) => favoriteSet.has(slug));
  return [
    ...(favoriteSet.size > 0
      ? [{
        title: 'Your Favorites',
        options: [{ slug: 'favorites', name: 'All Favorites', label: 'All Favorites', color: '' }, ...mine],
      }]
      : []),
    { title: 'Services', options: all.filter(({ slug }) => !favoriteSet.has(slug)) },
  ].map((group) => ({ ...group, options: group.options.filter(({ name }) => matches(name)) }));
});

async function prepare() {
  picked = [...applied];
  query = '';
  if (sources) return;
  const response = await api().watchnow.sources.country({ params: { countryCode: country } }).catch(() => null);
  sources = toSourceMap(response?.status === 200 ? response.body : null, country);
}

function reload(slugs: readonly string[]) {
  const url = new URL(page.url);
  url.searchParams.delete('page');
  if (slugs.length > 0) url.searchParams.set('watchnow', slugs.join(','));
  else url.searchParams.delete('watchnow');
  // eslint-disable-next-line svelte/no-navigation-without-resolve -- the current page with a new query string
  void goto(url);
}
</script>

<FilterPopover svg={play} label="Filter by streaming services" active={applied.length > 0} {placeholder}
  tooltip={placeholder ? 'Choose a type to filter by streaming services' : 'Filter by Streaming Services'}
  title="Available to watch on" help="Only display items available to watch on these streaming services."
  note={picked.length > 0 ? `${picked.length} picked` : undefined} clearable={applied.length > 0 || picked.length > 0}
  onopen={() => void prepare()} onapply={() => reload(picked)} onclear={() => reload([])}>
  <label class="panel-field">
    <Icon svg={search} />
    <input type="search" placeholder="Netflix, Max…" aria-label="Search services" bind:value={query} />
  </label>
  <div class="options" role="group" aria-label="Streaming services" aria-busy={sources === null}>
    {#if sources === null}<p class="loading">Loading services…</p>{/if}
    {#each groups as group (group.title)}
      {#if group.options.length > 0}
        <p class="header">{group.title}</p>
        {#each group.options as option (option.slug)}
          <label class="option">
            <input type="checkbox" value={option.slug} bind:group={picked} />
            <span class={['logo', { favorites: option.slug === 'favorites' }]} style:--service-color={option.color}>
              {#if option.slug === 'favorites'}<Icon svg={heart} />{:else if option.logo}<img src={option.logo} alt=""
                />{:else}{option.name.charAt(0)}{/if}
            </span>
            <span class="name">{option.label}</span>
            {#if option.tag}<span class="tag" style:--service-color={option.color}>{#if 'channel' in option && option.channel}<img
                  src={option.channel} alt={option.tag} />{:else}{option.tag}{/if}</span>{/if}
            <span class="check"><Icon svg={check} /></span>
          </label>
        {/each}
      {/if}
    {/each}
  </div>
</FilterPopover>

<style>
.options {
  max-block-size: var(--watchnow-filter-list-height);
  margin: var(--space-menu) calc(var(--space-filter-popover) * -1 + var(--space-menu)) 0;
  scrollbar-width: thin;
  overflow-y: auto;
}

.header {
  margin: 0;
  padding: var(--space-menu-header);
  color: var(--color-menu-header);
  font-size: var(--font-size-menu-header);
  font-weight: var(--font-weight-menu-header);
  letter-spacing: var(--letter-spacing-menu-header);
  text-transform: uppercase;
}

.loading {
  margin: 0;
  padding: var(--space-menu-row);
  color: var(--color-control-muted);
}

/* A menu row with a hidden checkbox and the service's logo tile: bold red with the check on the right once picked. */
.option {
  display: flex;
  align-items: center;
  gap: var(--space-service-row);
  padding: var(--space-service-row-padding);
  border-radius: var(--radius-menu-row);
  cursor: pointer;

  &:is(:hover, :focus-within) {
    background-color: var(--color-menu-row-hover);
    color: var(--color-menu-row-hover-text);
  }

  &:has(input:checked) {
    color: var(--brand-primary);
    font-weight: var(--font-weight-headings-heavy);
  }

  & input {
    position: absolute;
    opacity: 0;
    pointer-events: none;
  }
}

/* OG's service tile in miniature: the white logo on the brand color. */
.logo {
  display: inline-grid;
  flex: none;
  place-items: center;
  inline-size: var(--service-mini-width);
  block-size: var(--service-mini-height);
  padding: var(--service-mini-padding);
  border: 1px solid var(--color-menu-border);
  border-radius: var(--radius-service-mini);
  background-color: var(--service-color);
  color: var(--color-text-inverse);
  font-family: var(--font-headings);
  font-weight: var(--font-weight-headings-heavy);

  & img {
    inline-size: 100%;
    block-size: 100%;
    object-fit: contain;
  }

  &.favorites {
    background-color: var(--color-control-bg);
    color: var(--brand-primary);
  }
}

/* The store a channel is sold through, at the row's end: its white logo on the service's color, or its name. */
.tag {
  display: inline-flex;
  flex: none;
  align-items: center;
  block-size: var(--service-tag-height);
  padding: var(--space-service-tag);
  border-radius: var(--radius-search-kbd);
  background-color: var(--service-color);
  color: var(--color-text-inverse);
  font-size: var(--font-size-service-tag);
  font-weight: var(--font-weight-headings-heavy);
  line-height: 1;

  & img {
    block-size: 100%;
  }
}

.name {
  flex: 1;
  min-inline-size: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.check {
  display: none;
  font-size: var(--font-size-menu-check);

  .option:has(input:checked) & {
    display: inline-flex;
  }
}
</style>
