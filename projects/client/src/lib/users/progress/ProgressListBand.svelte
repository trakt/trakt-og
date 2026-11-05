<!--
  The band under the subnav when progress is narrowed to a list (`?list=`): a list row's fan of the first five
  posters, smaller, then "Displaying shows from this list" as a menu header over the list's name and owner (avatar and
  VIP label), and a round X that drops the list ("Return to your progress"), all centered on the fan. A shimmer holds
  the name and owner while the list streams in; a list that can't be read leaves the band out. OG showed a title band
  and the full list row here; og keeps it to one short band so the rows stay near the top.
-->
<script lang="ts">
import { page } from '$app/state';
import { SvelteURLSearchParams } from 'svelte/reactivity';
import FilterBand from '$lib/components/filters/FilterBand.svelte';
import VipLabel from '$lib/components/labels/VipLabel.svelte';
import type { ProgressListRow } from './loadProgressListRow.ts';

type Props = {
  row: Promise<ProgressListRow | null>;
};

const { row }: Props = $props();

const FAN_SIZE = 5;
const allHref = $derived.by(() => {
  const search = new SvelteURLSearchParams(page.url.searchParams);
  search.delete('list');
  search.delete('page');
  const query = search.toString();
  return query ? `${page.url.pathname}?${query}` : page.url.pathname;
});
</script>

<!-- List and profile hrefs come in as props, and resolve() only takes routes it can type. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->

{#snippet band(list: ProgressListRow | null)}
  <!-- The rows' gap, so the name lines up with the show titles below. -->
  <FilterBand --filter-band-gap="var(--progress-row-gap)" header="Displaying shows from this list"
    title={list ? { text: list.name, href: list.href } : undefined}
    clear={{ href: allHref, label: 'Return to your progress' }}>
    {#snippet art()}
      {#if list}
        <a class="fan" href={list.href} tabindex="-1" aria-hidden="true">
          {#each list.posters.slice(0, FAN_SIZE) as poster, index (index)}
            {#if poster.image}<img src={poster.image} alt="" title={poster.title} />{/if}
          {/each}
        </a>
      {:else}
        <span class="fan"></span>
      {/if}
    {/snippet}
    {#snippet meta()}
      {#if list}
        <a class="owner" href={list.owner.href}>
          <span class="avatar">{#if list.owner.avatar}<img src={list.owner.avatar} alt="" />{/if}</span>
          {list.owner.name}
        </a>
        {#if list.owner.vip}<VipLabel badge={list.owner.vip} pill />{/if}
      {/if}
    {/snippet}
  </FilterBand>
{/snippet}

{#await row}
  {@render band(null)}
{:then list}
  {#if list}{@render band(list)}{/if}
{/await}

<style>
.fan {
  display: flex;
  flex: none;
  --fan-width: var(--progress-list-fan-width);
  inline-size: var(--fan-width);
  block-size: var(--filter-band-poster-height);
  overflow: hidden;
  border-radius: var(--radius-list-card-fan);
  background-color: var(--color-list-card-placeholder);

  & img {
    flex: none;
    inline-size: var(--filter-band-poster-width);
    block-size: var(--filter-band-poster-height);
    object-fit: cover;
    background-color: var(--color-card-bg);

    & + img {
      /* Each poster after the first shows a quarter of the fan past the first poster. */
      margin-inline-start: calc((var(--fan-width) - var(--filter-band-poster-width)) / 4 - var(--filter-band-poster-width));
      box-shadow: var(--shadow-list-card-sliver);
    }
  }
}

.owner {
  display: inline-flex;
  align-items: center;
  gap: var(--space-stat);
  color: var(--color-text);
  font-weight: var(--font-weight-headings);

  &:is(:hover, :focus-visible) {
    color: var(--color-link);
  }
}

.avatar {
  flex: none;
  inline-size: var(--list-card-avatar-size);
  block-size: var(--list-card-avatar-size);
  overflow: hidden;
  border-radius: 50%;
  background-color: var(--color-avatar-border);

  & img {
    display: block;
    inline-size: 100%;
    block-size: 100%;
    object-fit: cover;
  }
}

/* The rows' posters narrow below desktop, and so does the fan over them. */
@media (width < 1200px) {
  .fan {
    --fan-width: var(--progress-list-fan-width-tablet);
  }
}
</style>
