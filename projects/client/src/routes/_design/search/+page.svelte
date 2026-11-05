<!--
  The search results in each Display choice a viewer can pick (the grid or the list, with posters, fanart, logos or no
  art), as the demo viewer sees them.
-->
<script lang="ts">
import { page } from '$app/state';
import Header from '#lib/components/header/Header.svelte';
import Specimen from '#lib/design/Specimen.svelte';
import SearchPage from '#lib/search/SearchPage.svelte';
import { SEARCH_ARTWORK } from '#lib/search/searchDisplay.ts';

const { data } = $props();

const choices = [
  { name: 'view', label: 'View', values: ['grid', 'list'] },
  { name: 'artwork', label: 'Artwork', values: SEARCH_ARTWORK },
] as const;
const choiceHref = (name: string, value: string) => {
  const url = new URL(page.url.href);
  url.searchParams.set(name, value);
  return `${url.pathname}${url.search}`;
};
// A search on Shows & Movies, one on Lists, and an empty Lists search, which browses the popular lists.
const searches = [
  { label: 'star wars', tab: '', query: 'star wars' },
  { label: 'lists: star wars', tab: 'lists', query: 'star wars' },
  { label: 'lists: empty', tab: 'lists', query: '' },
] as const;
const searchHref = (tab: string, query: string) =>
  `${page.url.pathname}?${new URLSearchParams({ ...(tab ? { tab } : {}), q: query })}`;
</script>

<!-- The choice links only change this page's query, so resolve() has nothing to add. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->
<Specimen title="Search results" bleed
  note="The real search page on a live search. Pick a view and artwork, as the sidebar's Display does, or search for something else. An empty Lists search browses the popular lists: pick All, Personal or Official from the sidebar's Type menu.">
  <div class="choices">
    <nav class="images" aria-label="Search">
      {#each searches as search (search.label)}
        <a href={searchHref(search.tab, search.query)}
          aria-current={search.tab === data.slug && search.query === data.query ? 'page' : undefined}>{search.label}</a>
      {/each}
    </nav>
    {#each choices as choice (choice.name)}
      <nav class="images" aria-label={choice.label}>
        {#each choice.values as value (value)}
          <a href={choiceHref(choice.name, value)} aria-current={value === data.display[choice.name] ? 'page' : undefined}
          >{value}</a>
        {/each}
      </nav>
    {/each}
  </div>
  <div class="site">
    <Header user={data.user} searchType={data.searchType} />
    <SearchPage {data} />
  </div>
</Specimen>

<style>
.choices {
  display: grid;
  gap: var(--space-sm-block);
  padding: var(--design-canvas-padding);
}

.images {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm-inline);

  & a {
    padding: var(--space-xs-block) var(--space-base-inline);
    border-radius: var(--radius-round);
    box-shadow: inset 0 0 0 1px var(--color-link-button-line);
    color: inherit;
    font-family: var(--font-headings);
    font-size: var(--font-size-small);
    font-weight: var(--font-weight-headings);
    text-decoration: none;
    text-transform: capitalize;

    &:hover {
      background-color: var(--color-link-button-hover);
    }

    &[aria-current='page'] {
      background-color: var(--brand-primary);
      box-shadow: none;
      color: var(--color-text-inverse);
    }
  }
}

/* The bar is fixed to this frame instead of the window, as it is on the page. */
.site {
  contain: layout;
}
</style>
