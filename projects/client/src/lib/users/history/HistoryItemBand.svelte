<!--
  The band under the history's subnav when it's narrowed to one title (`?movie=`, `?show=`, `?season=`, `?episode=`):
  the title's fanart (an episode's still), then what's shown ("Displaying episodes from this season", "Displaying this
  movie") over a season's show (an episode's show and season), each opening the history narrowed to it, and its name
  with its year in gray, and a round X back to all of the history.
-->
<script lang="ts">
import FilterBand from '#lib/components/filters/FilterBand.svelte';
import type { HistoryItem } from './historyFilters.ts';
import type { HistoryItemBand } from './historyItemBand.ts';

type Props = {
  band: HistoryItemBand;
  /** The history without the title. */
  allHref: string;
  /** The history narrowed to a show or season instead, for the line over the name. */
  itemHref: (item: HistoryItem) => string;
};

const { band, allHref, itemHref }: Props = $props();

const HEADERS: Readonly<Record<HistoryItemBand['type'], string>> = {
  movie: 'Displaying this movie',
  show: 'Displaying episodes from this show',
  season: 'Displaying episodes from this season',
  episode: 'Displaying this episode',
};
</script>

<!-- Title hrefs come in as props, and resolve() only takes routes it can type. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->
<FilterBand header={HEADERS[band.type]} title={{ text: band.title, href: band.href, year: band.year }}
  clear={{ href: allHref, label: 'Return to all history' }} parents={band.parents ? parents : undefined}>
  {#snippet art()}
    <a class="fanart" href={band.href} tabindex="-1" aria-hidden="true">
      {#if band.image}<img src={band.image} alt="" />{/if}
    </a>
  {/snippet}
</FilterBand>

{#snippet parents()}
  {#each band.parents ?? [] as parent, index (parent.item.type)}
    {#if index > 0}<span class="divider" aria-hidden="true">/</span>{/if}<a href={itemHref(parent.item)}>{parent.title}</a>
  {/each}
{/snippet}

<style>
.fanart {
  flex: none;
  inline-size: var(--filter-band-fanart-width);
  block-size: var(--filter-band-poster-height);
  overflow: hidden;
  border-radius: var(--radius-list-card-fan);
  background-color: var(--color-list-card-placeholder);

  & img {
    display: block;
    inline-size: 100%;
    block-size: 100%;
    object-fit: cover;
  }
}

a:not(.fanart) {
  color: var(--color-text);
  font-weight: var(--font-weight-headings);

  &:is(:hover, :focus-visible) {
    color: var(--color-link);
  }
}

.divider {
  color: var(--color-text-muted);
}
</style>
