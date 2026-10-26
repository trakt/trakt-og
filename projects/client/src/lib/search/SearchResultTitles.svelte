<!--
  A search result's titles: an episode's show in a small gray line, then the title with an episode's number bold
  before it and the year smaller and lighter after it, its digits as tall as the title's lowercase letters. The title
  wraps to two lines at most. `large` is the list's, a size up.
    <SearchResultTitles {card} spoiler={icons.collectionTarget} />
-->
<script lang="ts">
import MediaSpoiler from '$lib/components/summary/MediaSpoiler.svelte';
import type { ComponentProps } from 'svelte';
import type { SearchCard } from './SearchCard.ts';

interface Props {
  card: SearchCard;
  spoiler: ComponentProps<typeof MediaSpoiler>['target'];
  large?: boolean;
}

const { card, spoiler, large = false }: Props = $props();
</script>

<!-- Hrefs point at OG routes og hasn't built yet, and resolve() only takes routes that exist. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->

<div class={['titles', { large }]}>
  {#if card.smallTitle}
    <a class="small" href={card.smallTitle.href}>{card.smallTitle.text}</a>
  {/if}
  <h3>
    {#if card.number}<a class="number" href={card.href}>{card.number}&nbsp;</a>{/if}<MediaSpoiler target={spoiler}
      kind="title" inline><a href={card.href}>{card.title}</a></MediaSpoiler>{#if card.year}<span class="year"
      >{card.year}</span>{/if}
  </h3>
</div>

<style>
.titles {
  display: grid;
  min-inline-size: 0;
}

a {
  color: inherit;
  text-decoration: none;

  &:is(:hover, :focus-visible) {
    text-decoration: underline;
  }
}

.small {
  overflow: hidden;
  color: var(--color-frame-ink-muted);
  font-size: var(--font-size-small);
  font-weight: var(--font-weight-headings);
  line-height: var(--search-small-line);
  text-overflow: ellipsis;
  white-space: nowrap;
}

h3 {
  display: -webkit-box;
  margin: 0;
  overflow: hidden;
  color: var(--color-frame-ink);
  font-size: var(--search-title-size);
  font-weight: var(--font-weight-headings-heavy);
  line-height: var(--search-title-line);
  -webkit-box-orient: vertical;
  -webkit-line-clamp: var(--search-title-lines);
  line-clamp: var(--search-title-lines);

  & :global(.spoiler-content.inline) {
    display: inline;
  }
}

.large h3 {
  font-size: var(--search-row-title-size);
  line-height: var(--search-row-title-line);
}

.number {
  font-weight: var(--font-weight-headings-heavy);
}

.year {
  margin-inline-start: var(--space-search-year);
  color: var(--color-frame-ink-muted);
  font-size: var(--search-year-size);
  font-weight: normal;
}
</style>
