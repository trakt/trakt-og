<!--
  The search results page in a SidebarFrame, like the charts': the type picker ("Search Results" over the type, its
  menu grouped like the header search) with the fade/hide tool, the count, the under-title, the small-screen search
  field and the page pager in the sidebar, then the card grid in the viewer's search image type, list rows on the Lists
  tab or avatar cards on the Users tab. The frame is dark in every theme, which covers OG's forced dark knight.
-->
<script lang="ts">
import { page } from '$app/state';
import { untrack } from 'svelte';
import { goto } from '$app/navigation';
import { resolve } from '$app/paths';
import defaultCover from '$lib/assets/profile-cover-default.jpg';
import FadeHideMenu from '$lib/components/filters/FadeHideMenu.svelte';
import SearchField from '$lib/components/filters/SearchField.svelte';
import { type FadeHide, matchesFadeHide } from '$lib/components/filters/fadeHide';
import { searchHideHref } from '$lib/search/searchHideHref';
import Dropdown from '$lib/components/dropdown/Dropdown.svelte';
import FrameGrid from '$lib/components/frame/FrameGrid.svelte';
import FanartCard from '$lib/components/media/FanartCard.svelte';
import ListRow from '$lib/components/media/ListRow.svelte';
import { quickIconFill } from '$lib/components/media/quickIconFill';
import NoResults from '$lib/components/empty/NoResults.svelte';
import { pageHref } from '$lib/components/pagination/pageWindow';
import PagePager from '$lib/components/sidebar/PagePager.svelte';
import RailGroup from '$lib/components/sidebar/RailGroup.svelte';
import RailPager from '$lib/components/sidebar/RailPager.svelte';
import SidebarFrame from '$lib/components/sidebar/SidebarFrame.svelte';
import SidebarTitle from '$lib/components/sidebar/SidebarTitle.svelte';
import { viewerRecentSearches } from '$lib/components/header/viewerRecentSearches';
import { overlay } from '$lib/overlay/overlay';
import ListEditor from '$lib/components/lists/ListEditor.svelte';
import { createItemListActions } from '$lib/itemLists/createItemListActions.svelte';
import { findSearchType } from '$lib/search/findSearchType';
import RecentSearchesSection from '$lib/search/RecentSearchesSection.svelte';
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
  episodes: 'Episode',
  people: 'Person',
  lists: 'List',
  users: 'User',
};
const metaType = $derived(META_TYPES[data.slug]);
const meta = $derived(
  metaType
    ? {
      title: `${metaType} search results for ${data.query}`,
      description: `${metaType} search results for movies, TV shows, episodes, lists, and people.`,
    }
    : { title: `Search results for ${data.query}`, description: 'Search results for movies and TV shows.' },
);

const prevHref = $derived(data.page.current > 1 ? pageHref(page.url, data.page.current - 1) : undefined);
const nextHref = $derived(
  data.page.type === 'paginated' && data.page.current < data.page.total
    ? pageHref(page.url, data.page.current + 1)
    : undefined,
);
// posters and banners get their own columns, the other image types the fanart ones.
const gridVariant = $derived(
  data.imageType === 'poster' || data.imageType === 'banner' ? data.imageType : 'uniform',
);
const cardVariant = $derived(
  data.imageType === 'poster' || data.imageType === 'banner' ? data.imageType : 'fanart',
);
// The Lists tab's row icons, with the owner's edit and delete, as on an item's lists page.
const listViewer = $derived(page.data.user ? { slug: page.data.user.slug, isVip: page.data.user.isVip } : null);
const own = createItemListActions({ viewer: () => listViewer, origin: () => page.url.origin });
const listsShown = $derived(own.visible(data.lists));
const hasResults = $derived(data.cards.length > 0 || data.lists.length > 0 || data.users.length > 0);
let fadeHide = $derived(data.filters.fadeHide);

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
  cookie="search" variant="default" onchange={save} />
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

    {#if data.page.type === 'paginated' && paged}
      <PagePager current={data.page.current} total={data.page.total} href={(n) => pageHref(page.url, n)} />
    {/if}

    {#if recent}
      <RecentSearchesSection terms={recent.terms} open={data.sidebar.recent} query={data.query} slug={data.slug}
        onremove={(term) => recent?.remove(term)} onclear={clearRecent} />
    {/if}
  {/snippet}

  {#snippet rail()}
    {#if paged}
      <RailGroup><RailPager unit="page" label="P{data.page.current}" {prevHref} {nextHref} /></RailGroup>
    {/if}
    {#if data.filters.visible}<RailGroup tools>{@render tools()}</RailGroup>{/if}
  {/snippet}

  {#if data.users.length > 0}
    <!-- OG hid the quick icons on user cards. -->
    <FrameGrid variant="uniform">
      {#each data.users as user (user.key)}
        <FanartCard href={user.href} title={user.title} image={user.cover ?? defaultCover} avatar={user.avatar}
          tags={user.tags} />
      {/each}
    </FrameGrid>
  {:else if data.lists.length > 0}
    <div class="lists">
      {#each listsShown as list (list.key)}
        <ListRow {...list} mine={list.owner.slug === page.data.user?.slug} likeTarget={{ id: list.id, ownerSlug: list.kind === 'personal' ? list.owner.slug : undefined, viewer: page.data.user?.slug ?? null }}
          actions={own.actions(list)} />
      {/each}
    </div>
  {:else if data.cards.length > 0}
    <FrameGrid variant={gridVariant}>
      {#each data.cards as card (card.key)}
        {@const state = card.type === 'person' ? undefined : overlay.state(card.type, card.id, card.season)}
        {@const fill = quickIconFill({ state: state ?? {}, airedEpisodes: card.airedEpisodes, datePreferences: data.datePreferences })}
        {#if !state || !fadeHide.hide.some((id) => matchesFadeHide(id, state, fill))}
        <FanartCard
          variant={cardVariant}
          href={card.href}
          title={card.title}
          year={card.year}
          smallTitle={card.smallTitle}
          image={card.image}
          logo={card.logo}
          logoMode={card.logoMode}
          tags={card.tags}
          hideTitle={card.hideTitle}
          episodeBadge={card.episodeBadge}
          userRating={state?.rating}
          dropped={state?.dropped}
          faded={Boolean(state && fadeHide.fade.some((id) => matchesFadeHide(id, state, fill)))}
          icons={state && card.type !== 'person'
          ? {
            fill,
            ratingTarget: { type: card.type, id: card.id, title: card.title },
            watchTarget: { type: card.type, id: card.id, title: card.title, airedEpisodes: card.airedEpisodes, runtime: card.runtime, season: card.season },
            rating: card.released ? card.rating : undefined,
            // ponytail: like the charts, an item that isn't out yet is taken to have no sources until #60.
            watchNow: card.released ? 'play' : undefined,
            listLabel: card.type === 'episode' ? 'Add to list' : undefined,
          }
          : undefined}
        />
        {/if}
      {/each}
    </FrameGrid>
  {/if}

  {#if !hasResults}
    <div class="no-results">
      <NoResults />
    </div>
  {/if}
</SidebarFrame>

{#if own.editor}<ListEditor id={own.editor.id} posters={own.editor.posters} count={own.editor.count}
  onclose={own.closeEditor} />{/if}

<style>
/* The rows sit in from the frame's edges, like a page's sections. */
.lists {
  padding: 0 var(--gutter) var(--gutter);
}

.no-results {
  display: grid;
  place-items: center;
  min-block-size: calc(100vh - var(--header-height));
}
</style>
