<!--
  The stats page's Community tiles: favorites, watchers, plays, libraries, lists and comments, each ruled and iconed in
  its ratings strip color, with the short number and a line on what it means. Lists and comments open their pages.
-->
<script lang="ts">
import { stripStatIcons } from '$lib/components/summary/stripStatIcons';
import Icon from '$lib/icons/Icon.svelte';
import type { toCommunityStats } from './toCommunityStats.ts';

type Tile = ReturnType<typeof toCommunityStats>[number];

const { tiles }: { tiles: readonly Tile[] } = $props();
</script>

<!-- The lists and comments pages are built, but resolve() can't type their dynamic paths. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->

{#snippet body(tile: Tile)}
  <span class="label"><span class="glyph"><Icon svg={stripStatIcons[tile.kind]} /></span>{tile.title}</span>
  <span
  class="value"><span aria-hidden="true">{tile.value}</span><span class="visually-hidden">{tile.exact}</span></span>
  <span class="note">{tile.note}</span>
{/snippet}

<ul class="tiles">
  {#each tiles as tile (tile.kind)}
    <li style:--color={tile.kind === 'comments' ? 'var(--color-stat-comments)' : `var(--color-strip-${tile.kind})`}>
      {#if tile.href}
        <a class="tile" href={tile.href}>{@render body(tile)}</a>
      {:else}
        <div class="tile">{@render body(tile)}</div>
      {/if}
    </li>
  {/each}
</ul>

<style>
.tiles {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(var(--stats-tile-min), 1fr));
  gap: var(--space-stats-tiles);
  margin: 0;
  padding: 0;
  list-style: none;
}

.tile {
  display: block;
  block-size: 100%;
  padding: var(--space-stats-tile);
  border-block-start: var(--stats-tile-rule) solid var(--color);
  background-color: var(--color-stats-tile-bg);
  color: var(--color-text);
  text-decoration: none;

  &:is(a):is(:hover, :focus-visible) {
    background-color: var(--color-stats-tile-hover);
    color: var(--color-text);
    text-decoration: none;
  }
}

.label {
  display: flex;
  align-items: center;
  gap: var(--strip-item-gap);
  color: var(--color-genre-label);
  font-family: var(--font-headings);
  font-size: var(--font-size-genre-label);
  font-weight: var(--font-weight-headings);
  text-transform: uppercase;
}

.glyph {
  display: inline-flex;
  color: var(--color);
}

.value {
  display: block;
  margin-block-start: var(--space-stats-tile-value);
  font-family: var(--font-headings);
  font-size: var(--font-size-stats-tile-value);
  font-weight: var(--font-weight-headings-heavy);
  font-variant-numeric: tabular-nums;
  line-height: var(--line-height-genre-share);
}

.note {
  display: block;
  color: var(--color-genre-count);
  font-size: var(--font-size-genre-key-count);
}

.visually-hidden {
  position: absolute;
  inline-size: 1px;
  block-size: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}
</style>
