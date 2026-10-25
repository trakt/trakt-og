<!--
  The search results in each image type a viewer can pick (poster, thumb, screenshot, fanart, logo or banner), as the
  demo viewer sees them.
-->
<script lang="ts">
import { page } from '$app/state';
import Header from '$lib/components/header/Header.svelte';
import Specimen from '$lib/design/Specimen.svelte';
import SearchPage from '$lib/search/SearchPage.svelte';

const { data } = $props();

const images = ['poster', 'thumb', 'screenshot', 'fanart', 'logo', 'banner'];
const imageHref = (image: string) => {
  const url = new URL(page.url);
  url.searchParams.set('image', image);
  return `${url.pathname}${url.search}`;
};
const current = $derived(page.url.searchParams.get('image') ?? 'poster');
</script>

<!-- The image links only change this page's query, so resolve() has nothing to add. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->
<Specimen title="Search results" bleed
  note="The real search page on a live search. Pick the image type a viewer chose in their settings, or search for something else.">
  <nav class="images" aria-label="Image type">
    {#each images as image (image)}
      <a href={imageHref(image)} aria-current={image === current ? 'page' : undefined}>{image}</a>
    {/each}
  </nav>
  <div class="site">
    <Header user={data.user} searchType={data.searchType} />
    <SearchPage {data} />
  </div>
</Specimen>

<style>
.images {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm-inline);
  padding: var(--design-canvas-padding);

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
