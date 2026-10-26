<!--
  The search results page in a SidebarFrame, like the charts': the type picker ("Search Results" over the type, its
  menu grouped like the header search) with the fade/hide tool, the count, the under-title, the small-screen search
  field, the page pager, the recent searches and the Display choices (grid or list, and the artwork) in the sidebar,
  then the results as the calendar's cards or agenda rows, or list rows on the Lists tab. The frame is dark in every
  theme, which covers OG's forced dark knight.
-->
<script lang="ts">
import { page } from '$app/state';
import { untrack } from 'svelte';
import { goto } from '$app/navigation';
import { resolve } from '$app/paths';
import FadeHideMenu from '$lib/components/filters/FadeHideMenu.svelte';
import SearchField from '$lib/components/filters/SearchField.svelte';
import { type FadeHide, type FadeHideOption, matchesFadeHide } from '$lib/components/filters/fadeHide';
import { searchHideHref } from '$lib/search/searchHideHref';
import Dropdown from '$lib/components/dropdown/Dropdown.svelte';
import ListRow from '$lib/components/media/ListRow.svelte';
import { mediaQuickIcons } from '$lib/components/media/mediaQuickIcons';
import EmptyState from '$lib/components/empty/EmptyState.svelte';
import NoResults from '$lib/components/empty/NoResults.svelte';
import { pageHref } from '$lib/components/pagination/pageWindow';
import PagePager from '$lib/components/sidebar/PagePager.svelte';
import CountPill from '$lib/components/sidebar/CountPill.svelte';
import IconSwitch from '$lib/components/sidebar/IconSwitch.svelte';
import RailGroup from '$lib/components/sidebar/RailGroup.svelte';
import RailPager from '$lib/components/sidebar/RailPager.svelte';
import SidebarFrame from '$lib/components/sidebar/SidebarFrame.svelte';
import SidebarSection from '$lib/components/sidebar/SidebarSection.svelte';
import SidebarTitle from '$lib/components/sidebar/SidebarTitle.svelte';
import { viewerRecentSearches } from '$lib/components/header/viewerRecentSearches';
import Icon from '$lib/icons/Icon.svelte';
import grid from '$lib/icons/regular/grid-2.svg?raw';
import list from '$lib/icons/regular/list.svg?raw';
import { overlay } from '$lib/overlay/overlay';
import ListEditor from '$lib/components/lists/ListEditor.svelte';
import { createItemListActions } from '$lib/itemLists/createItemListActions.svelte';
import { findSearchType } from '$lib/search/findSearchType';
import RecentSearchesSection from '$lib/search/RecentSearchesSection.svelte';
import {
  SEARCH_ARTWORK,
  SEARCH_DISPLAY_COOKIES,
  type SearchArtwork,
  type SearchDisplay,
  type SearchView,
} from '$lib/search/searchDisplay';
import SearchResultCard from '$lib/search/SearchResultCard.svelte';
import SearchResultRow from '$lib/search/SearchResultRow.svelte';
import { searchLinks } from '$lib/search/searchLinks';
import type { DatePreferences } from '$lib/settings/DatePreferences';
import type { loadSearch } from '$lib/search/loadSearch';

type Props = {
  data: Awaited<ReturnType<typeof loadSearch>> & { datePreferences: DatePreferences };
};

const { data }: Props = $props();

// The viewer's recent searches, the same list the header search keeps. Each search made here goes to its top. Signed
// out, there's none.
const viewer = $derived<string | null>(page.data.user?.slug ?? null);
let recent = $state.raw<ReturnType<typeof viewerRecentSearches>>();
$effect(() => {
  recent = viewer ? viewerRecentSearches(viewer) : undefined;
});
$effect(() => {
  const store = recent;
  const search = { query: data.query, type: data.slug };
  untrack(() => store?.record(search));
});
let field = $state<HTMLFormElement>();
// Clear all takes the section with it, so focus goes to the search field instead of the page.
const clearRecent = () => {
  recent?.clear();
  field?.querySelector('input')?.focus();
};

// The sidebar's search field. The picker's links carry whatever is typed there, like OG's search.js.
let terms = $derived(data.query);

const type = $derived(findSearchType(data.slug));
const groups = $derived(type ? searchLinks(type, terms.trim(), page.url.searchParams) : []);
const paged = $derived(data.page.type === 'paginated' && data.page.total > 1);

// OG named the tab by its model: Show, Movie, Person...
const META_TYPES: Readonly<Record<string, string>> = {
  shows: 'Show',
  movies: 'Movie',
  people: 'Person',
  lists: 'List',
};
const metaType = $derived(META_TYPES[data.slug]);
const meta = $derived(
  metaType
    ? {
      title: `${metaType} search results for ${data.query}`,
      description: `${metaType} search results for movies, TV shows, lists, and people.`,
    }
    : { title: `Search results for ${data.query}`, description: 'Search results for movies and TV shows.' },
);

const prevHref = $derived(data.page.current > 1 ? pageHref(page.url, data.page.current - 1) : undefined);
const nextHref = $derived(
  data.page.type === 'paginated' && data.page.current < data.page.total
    ? pageHref(page.url, data.page.current + 1)
    : undefined,
);
/* ---------- display ---------- */

let display = $derived<SearchDisplay>(data.display);
function setDisplay(patch: Partial<SearchDisplay>) {
  display = { ...display, ...patch };
  for (const key of Object.keys(patch) as (keyof SearchDisplay)[]) {
    document.cookie = `${SEARCH_DISPLAY_COOKIES[key]}=${display[key]}; path=/; samesite=lax; max-age=31536000`;
  }
}
const views: readonly { value: SearchView; label: string; icon: string }[] = [
  { value: 'grid', label: 'Grid', icon: grid },
  { value: 'list', label: 'List', icon: list },
];
// A person has only a headshot, so the People tab offers it or nothing.
const people = $derived(data.slug === 'people');
const artworkLabels = $derived<Record<SearchArtwork, string>>({
  poster: people ? 'Headshot' : 'Poster',
  fanart: 'Fanart',
  logo: 'Logo',
  none: 'None',
});
const artworkChoices = $derived<readonly SearchArtwork[]>(people ? ['poster', 'none'] : SEARCH_ARTWORK);
const artwork = $derived(artworkChoices.includes(display.artwork) ? display.artwork : 'poster');
// The Lists tab's row icons, with the owner's edit and delete, as on an item's lists page.
const listViewer = $derived(page.data.user ? { slug: page.data.user.slug, isVip: page.data.user.isVip } : null);
const own = createItemListActions({ viewer: () => listViewer, origin: () => page.url.origin });
const listsShown = $derived(own.visible(data.lists));
const hasResults = $derived(data.cards.length > 0 || data.lists.length > 0);
let fadeHide = $derived(data.filters.fadeHide);

// The cards the hide menu leaves, each with its overlay state, quick icons and whether it's faded.
const shownCards = $derived(
  data.cards.flatMap((card) => {
    const state = card.type === 'person' ? undefined : overlay.state(card.type, card.id, card.season);
    const icons = state && card.type !== 'person'
      ? mediaQuickIcons({
        item: { ...card, type: card.type, title: card.number ? `${card.number} ${card.title}` : card.title },
        state,
        datePreferences: data.datePreferences,
      })
      : undefined;
    const matches = (id: FadeHideOption) => Boolean(state && icons && matchesFadeHide(id, state, icons.fill));
    if (fadeHide.hide.some(matches)) return [];
    return [{ card, state, icons, faded: fadeHide.fade.some(matches) }];
  }),
);
const hiding = $derived(data.filters.visible && fadeHide.hide.length > 0);
const clearHideHref = $derived(searchHideHref(page.url, []));
// Shows or Movies alone can widen to both.
const widerHref = $derived(
  type && (data.slug === 'shows' || data.slug === 'movies')
    ? searchLinks(type, data.query, page.url.searchParams).at(0)?.links.at(0)?.href
    : undefined,
);

function save(next: FadeHide) {
  const reload = fadeHide.hide.join(',') !== next.hide.join(',');
  fadeHide = next;
  if (reload) {
    // The URL is built from the current route and preserves the user's query.
    goto(resolve(searchHideHref(page.url, next.hide) as `/search${string}`), { keepFocus: true, noScroll: true });
  }
}
</script>

<svelte:head>
  <title>{meta.title.trim()} - Trakt</title>
  <meta name="description" content={meta.description} />
</svelte:head>

<!-- The v3 link is another site, which resolve() doesn't cover. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->

{#snippet tools()}
  <FadeHideMenu value={fadeHide} options={data.filters.options} hideOptions={data.filters.hideOptions}
  cookie="search" onchange={save} />
{/snippet}

<SidebarFrame label="Search" collapsed={data.sidebar.collapsed} {prevHref} {nextHref}>
  {#snippet sidebar()}
    <SidebarTitle tools={data.filters.visible ? tools : undefined}>
      {#snippet heading()}
        <Dropdown variant="title" label="Pick a search type">
          {#snippet trigger()}<span class="eyebrow">Search Results</span><span class="name">{type?.label}</span
            >{/snippet}
          {#each groups as group, i (group.label)}
            {#if i > 0}<hr />{/if}
            <ul>
              <li class="header">{group.label}</li>
              {#each group.links as link (link.href)}
                <li><a href={link.href} aria-current={link.current ? 'page' : undefined}>{link.label}</a></li>
              {/each}
            </ul>
          {/each}
        </Dropdown>
      {/snippet}
    </SidebarTitle>

    <!-- The current query, ready to change: Enter searches again, and the picker's links carry what's typed. -->
    <form bind:this={field} action={page.url.pathname} method="get" role="search">
      <SearchField name="query" label={data.idMode ? 'Search ID' : 'Search terms'}
        placeholder="What are you looking for?" bind:value={terms} />
    </form>

    {#if data.count > 0}
      <div class="counts"><CountPill count={data.count} label="results" one="result" /></div>
    {/if}

    {#if data.page.type === 'paginated' && paged}
      <PagePager current={data.page.current} total={data.page.total} href={(n) => pageHref(page.url, n)} />
    {/if}

    {#if recent}
      <RecentSearchesSection terms={recent.terms} open={data.sidebar.recent} query={data.query} slug={data.slug}
        onremove={(term) => recent?.remove(term)} onclear={clearRecent} />
    {/if}

    {#if data.cards.length > 0}
      <SidebarSection id="display" title="Display" open={data.sidebar.display} remember>
        <IconSwitch label="View" value={display.view} options={views} onchange={(view) => setDisplay({ view })} />
        <Dropdown block section="Artwork">
          {#snippet trigger()}{artworkLabels[artwork]}{/snippet}
          <ul>
            {#each artworkChoices as choice (choice)}
              <li>
                <button type="button" aria-current={artwork === choice} onclick={() => setDisplay({ artwork: choice })}
                >{artworkLabels[choice]}</button>
              </li>
            {/each}
          </ul>
        </Dropdown>
      </SidebarSection>
    {/if}
  {/snippet}

  {#snippet rail()}
    {#if paged}
      <RailGroup><RailPager unit="page" label="P{data.page.current}" {prevHref} {nextHref} /></RailGroup>
    {/if}
    {#if data.filters.visible}<RailGroup tools>{@render tools()}</RailGroup>{/if}
    {#if data.cards.length > 0}
      <RailGroup>
        {#each views as view (view.value)}
          <button type="button" class="rail-view" aria-pressed={display.view === view.value} title="{view.label} view"
            onclick={() => setDisplay({ view: view.value })}><Icon svg={view.icon} label="{view.label} view" /></button>
        {/each}
      </RailGroup>
    {/if}
  {/snippet}

  {#if data.lists.length > 0}
    <div class="lists">
      {#each listsShown as list (list.key)}
        <ListRow {...list} mine={list.owner.slug === page.data.user?.slug} likeTarget={{ id: list.id, ownerSlug: list.kind === 'personal' ? list.owner.slug : undefined, viewer: page.data.user?.slug ?? null }}
          actions={own.actions(list)} />
      {/each}
    </div>
  {:else if shownCards.length > 0}
    <div class="results">
      <div class={['results-body', display.view, artwork]}>
        {#each shownCards as { card, state, icons, faded } (card.key)}
          {@const result = {
            card,
            artwork,
            userRating: state?.rating,
            dropped: state?.dropped,
            faded,
            icons: icons && { ...icons, listLabel: card.type === 'episode' ? 'Add to list' : undefined },
          }}
          {#if display.view === 'list'}<SearchResultRow {...result} />{:else}<SearchResultCard {...result} />{/if}
        {/each}
      </div>
    </div>
  {:else if hasResults}
    <div class="no-results">
      <NoResults action={{ href: clearHideHref, text: 'Show hidden results' }} />
    </div>
  {:else if !data.query}
    <div class="prompt">
      <EmptyState inFrame
      title={data.idMode ? 'Enter an ID to look it up.' : 'Search for shows, movies, people and lists.'} />
    </div>
  {:else}
    <div class="no-results">
      <NoResults action={hiding
        ? { href: clearHideHref, text: 'Show hidden results' } : widerHref
          ? { href: widerHref, text: 'Search shows & movies' }
          : undefined} />
    </div>
  {/if}
</SidebarFrame>

{#if own.editor}<ListEditor id={own.editor.id} posters={own.editor.posters} count={own.editor.count}
  onclose={own.closeEditor} />{/if}

<style>
.counts {
  display: flex;
}

/* Measured for the grid's columns. */
.results {
  container-type: inline-size;
}

.results-body.grid {
  display: grid;
  grid-template-columns: repeat(var(--columns, 1), minmax(0, 1fr));
  gap: var(--search-card-gap);
  padding: var(--search-results-padding);
}

/* The calendar list's columns by width. */
@container (width >= 468px) {
  .results-body.grid {
    --columns: 2;
  }
}

@container (width >= 692px) {
  .results-body.grid {
    --columns: 3;
  }
}

@container (width >= 1300px) {
  .results-body.grid {
    --columns: 4;
  }
}

/* Posters, a column more at each width, wide enough for the full poster quick-icon bar. */
.results-body.grid.poster {
  --columns: 2;
}

@container (width >= 468px) {
  .results-body.grid.poster {
    --columns: 3;
  }
}

@container (width >= 692px) {
  .results-body.grid.poster {
    --columns: 4;
  }
}

@container (width >= 900px) {
  .results-body.grid.poster {
    --columns: 5;
  }
}

@container (width >= 1300px) {
  .results-body.grid.poster {
    --columns: 6;
  }
}

.rail-view {
  display: grid;
  place-items: center;
  inline-size: var(--tool-size);
  block-size: var(--control-height-small);
  min-block-size: 0;
  padding: 0;
  border: 0;
  border-radius: var(--radius-control);
  background: none;
  color: var(--color-sidebar-pill-text);
  cursor: pointer;

  &:is(:hover, :focus-visible) {
    background-color: var(--color-control-hover-bg);
    color: var(--color-frame-ink);
  }

  &[aria-pressed='true'] {
    background-color: var(--color-control-raised-bg);
    color: var(--color-frame-ink);
  }
}

/* The rows sit in from the frame's edges, like a page's sections. */
.lists {
  padding: 0 var(--gutter) var(--gutter);
}

.prompt {
  padding: var(--gutter);
}

.no-results {
  display: grid;
  place-items: center;
  min-block-size: calc(100vh - var(--header-height));
}
</style>
