<!--
  The band under a page's subnav when the page is narrowed to one list or title: its art, then a menu header saying
  what's shown ("Displaying shows from this list") over an optional smaller line naming its parents, the name with
  its year in gray and a line about it, and a round X that drops the filter, all centered on the art. Without `title` it's loading: a shimmer holds the name and
  the line, and the X waits. `--filter-band-gap` sets the space after the art, so a page can line the name up with
  its rows.
    <FilterBand header="Displaying episodes from this season" title={{ text: 'Season 9', href, year: '2012 - 2013' }}
      clear={{ href: allHref, label: 'Return to all history' }}>
      {#snippet art()}<img src={poster} alt="" />{/snippet}
      {#snippet parents()}<a href={showHref}>The Office</a>{/snippet}
    </FilterBand>
-->
<script lang="ts">
import type { Snippet } from 'svelte';
import Container from '$lib/components/container/Container.svelte';
import Shimmer from '$lib/components/loading/Shimmer.svelte';
import Tooltip from '$lib/components/tooltip/Tooltip.svelte';
import Icon from '$lib/icons/Icon.svelte';
import deleteThick from '$lib/icons/trakt/delete-thick.svg?raw';

type Title = { readonly text: string; readonly href: string; readonly year?: string };

type Props = {
  header: string;
  title?: Title;
  clear?: { readonly href: string; readonly label: string };
  art: Snippet;
  /** Over the name, as small as the line under it: a season's show. */
  parents?: Snippet;
  meta?: Snippet;
};

const { header, title, clear, art, parents, meta }: Props = $props();
const id = $props.id();
</script>

<!-- The pages pass their own hrefs, and resolve() only takes routes it can type. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->
<section class="filter-band" aria-labelledby="{id}-header" aria-busy={!title}>
  <Container>
    <div class="band">
      {@render art()}
      <div class="body">
        <h2 id="{id}-header">{header}</h2>
        {#if title}
          {#if parents}<p class="meta parents">{@render parents()}</p>{/if}
          <h3><a class="name" href={title.href}>{title.text}</a>{#if title.year}<span class="year">{title.year}</span>{/if}</h3>
          {#if meta}<p class="meta">{@render meta()}</p>{/if}
        {:else}
          <Shimmer inline="var(--filter-band-shimmer-name-width)" block="var(--font-size-h4)" />
          <Shimmer inline="var(--filter-band-shimmer-meta-width)" block="var(--list-card-avatar-size)" />
        {/if}
      </div>
      {#if title && clear}
        <Tooltip text={clear.label}>
          {#snippet trigger(tooltip)}
            <a class="clear" href={clear.href} aria-label={clear.label} {...tooltip}><Icon svg={deleteThick} /></a>
          {/snippet}
        </Tooltip>
      {/if}
    </div>
  </Container>
</section>

<style>
.filter-band {
  padding-block: var(--filter-band-padding);
  background-color: var(--color-subnav-text-bg);
}

/* A dropdown's section header. */
h2 {
  margin: 0;
  color: var(--color-menu-header);
  font-size: var(--font-size-menu-header);
  font-weight: var(--font-weight-menu-header);
  letter-spacing: var(--letter-spacing-menu-header);
  line-height: 1;
  text-transform: uppercase;
}

.band {
  display: flex;
  align-items: center;
  gap: var(--filter-band-gap);
}

.body {
  display: grid;
  flex: 1;
  justify-items: start;
  gap: var(--list-card-body-gap);
  min-inline-size: 0;
}

.name {
  color: var(--color-text);

  &:is(:hover, :focus-visible) {
    color: var(--color-link);
  }
}

h3 {
  min-inline-size: 0;
  margin: 0;
  line-height: var(--line-height-filter-band-name);
  font-weight: var(--font-weight-headings);
  font-size: var(--font-size-h4);
  text-wrap: balance;
}

.year {
  margin-inline-start: 0.35em;
  color: var(--color-text-muted);
  font-size: var(--font-size-filter-band-year);
  font-weight: var(--font-weight-headings-light);
}

.meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-stat);
  margin: 0;
  color: var(--color-stat-noun);
  font-family: var(--font-headings);
  font-size: var(--font-size-list-row-meta);
}

/* Close over the name it belongs to: no gap but the name's own leading. */
.parents {
  margin-block-end: calc(-1 * var(--list-card-body-gap));
  line-height: 1;
}

.clear {
  display: grid;
  flex: none;
  place-items: center;
  inline-size: var(--filter-band-close-size);
  block-size: var(--filter-band-close-size);
  border: 1px solid var(--color-filter-band-close-border);
  border-radius: 50%;
  background-color: var(--color-filter-band-close-bg);
  color: var(--color-stat-noun);
  font-size: var(--font-size-dialog-art-close);
  /* The Trakt-font X sits high in its box; down to the circle's middle. */
  --icon-shift: var(--quick-icon-trakt-shift);

  &:is(:hover, :focus-visible) {
    background-color: var(--color-filter-band-close-hover);
    color: var(--color-text);
  }
}
</style>
