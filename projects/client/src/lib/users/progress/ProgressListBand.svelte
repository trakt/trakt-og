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
import Container from '$lib/components/container/Container.svelte';
import VipLabel from '$lib/components/labels/VipLabel.svelte';
import Shimmer from '$lib/components/loading/Shimmer.svelte';
import Tooltip from '$lib/components/tooltip/Tooltip.svelte';
import Icon from '$lib/icons/Icon.svelte';
import deleteThick from '$lib/icons/trakt/delete-thick.svg?raw';
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
  <section class="list-band" aria-labelledby="progress-list-title" aria-busy={list === null}>
    <Container>
      <div class="band">
        {#if list}
          <a class="fan" href={list.href} tabindex="-1" aria-hidden="true">
            {#each list.posters.slice(0, FAN_SIZE) as poster, index (index)}
              {#if poster.image}<img src={poster.image} alt="" title={poster.title} />{/if}
            {/each}
          </a>
        {:else}
          <span class="fan"></span>
        {/if}
        <div class="body">
          <h2 id="progress-list-title">Displaying shows from this list</h2>
          {#if list}
            <a class="name" href={list.href}><h3>{list.name}</h3></a>
            <p class="by">
              <a class="owner" href={list.owner.href}>
                <span class="avatar">{#if list.owner.avatar}<img src={list.owner.avatar} alt="" />{/if}</span>
                {list.owner.name}
              </a>
              {#if list.owner.vip}<VipLabel badge={list.owner.vip} pill />{/if}
            </p>
          {:else}
            <Shimmer inline="var(--progress-list-shimmer-name-width)" block="var(--font-size-h4)" />
            <Shimmer inline="var(--progress-list-shimmer-owner-width)" block="var(--list-card-avatar-size)" />
          {/if}
        </div>
        {#if list}
          <Tooltip text="Return to your progress">
            {#snippet trigger(tooltip)}
              <a class="clear" href={allHref} aria-label="Return to your progress" {...tooltip}><Icon svg={deleteThick} /></a>
            {/snippet}
          </Tooltip>
        {/if}
      </div>
    </Container>
  </section>
{/snippet}

{#await row}
  {@render band(null)}
{:then list}
  {#if list}{@render band(list)}{/if}
{/await}

<style>
.list-band {
  padding-block: var(--progress-list-band-padding);
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
  /* The rows' gap, so the name lines up with the show titles below. */
  gap: var(--progress-row-gap);
}

.fan {
  display: flex;
  flex: none;
  --fan-width: var(--progress-list-fan-width);
  inline-size: var(--fan-width);
  block-size: var(--progress-list-poster-height);
  overflow: hidden;
  border-radius: var(--radius-list-card-fan);
  background-color: var(--color-list-card-placeholder);

  & img {
    flex: none;
    inline-size: var(--progress-list-poster-width);
    block-size: var(--progress-list-poster-height);
    object-fit: cover;
    background-color: var(--color-card-bg);

    & + img {
      /* Each poster after the first shows a quarter of the fan past the first poster. */
      margin-inline-start: calc((var(--fan-width) - var(--progress-list-poster-width)) / 4 - var(--progress-list-poster-width));
      box-shadow: var(--shadow-list-card-sliver);
    }
  }
}

.body {
  display: grid;
  flex: 1;
  justify-items: start;
  gap: var(--list-card-body-gap);
  min-inline-size: 0;
}

.name {
  min-inline-size: 0;
  color: var(--color-text);

  &:is(:hover, :focus-visible) {
    color: var(--color-link);
  }
}

h3 {
  margin: 0;
  line-height: var(--line-height-progress-list-name);
  font-weight: var(--font-weight-headings);
  font-size: var(--font-size-h4);
  text-wrap: balance;
}

.by {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-stat);
  margin: 0;
  color: var(--color-stat-noun);
  font-family: var(--font-headings);
  font-size: var(--font-size-list-row-meta);
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
.clear {
  display: grid;
  flex: none;
  place-items: center;
  inline-size: var(--progress-list-close-size);
  block-size: var(--progress-list-close-size);
  border: 1px solid var(--color-progress-list-close-border);
  border-radius: 50%;
  background-color: var(--color-progress-list-close-bg);
  color: var(--color-stat-noun);
  font-size: var(--font-size-dialog-art-close);
  /* The Trakt-font X sits high in its box; down to the circle's middle. */
  --icon-shift: var(--quick-icon-trakt-shift);

  &:is(:hover, :focus-visible) {
    background-color: var(--color-progress-list-close-hover);
    color: var(--color-text);
  }
}
/* The rows' posters narrow below desktop, and so does the fan over them. */
@media (width < 1200px) {
  .fan {
    --fan-width: var(--progress-list-fan-width-tablet);
  }
}
</style>
