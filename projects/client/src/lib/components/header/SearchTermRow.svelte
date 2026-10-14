<!--
  A saved search query as a row: its icon, the query, "in People", and an × to remove it that stays hidden until the
  row is pointed at, highlighted or focused. The header search's Recent rows and the search page's Recent use it.
  With `href` the query is a link; otherwise `onpick` runs (the header puts it back in its field). Any other attributes
  land on the `li` (the header's option role, id and highlight).
    <SearchTermRow icon={clock} query="tron" type="Shows & Movies" href="/search?query=tron" onremove={remove} />
-->
<script lang="ts">
import Icon from '$lib/icons/Icon.svelte';
import xmark from '$lib/icons/light/xmark.svg?raw';
import type { HTMLLiAttributes } from 'svelte/elements';

interface Props extends HTMLLiAttributes {
  icon: string;
  query: string;
  /** The search type's name, after "in". */
  type?: string;
  href?: string;
  onpick?: () => void;
  /** Highlighted, from the keyboard or as the current search. */
  selected?: boolean;
  /** Left out, there's no ×. */
  onremove?: () => void;
  /** The query's tab stop: the header's combobox keeps focus in its field, so its rows take none. */
  tabbable?: boolean;
}

const {
  icon,
  query,
  type,
  href,
  onpick,
  selected = false,
  onremove,
  tabbable = true,
  ...rest
}: Props = $props();
</script>

<!-- The page builds the href from its own routes, so resolve() has nothing to add. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->

{#snippet label()}
  <span class="icon-slot"><Icon svg={icon} /></span>
  {query}
  {#if type}<span class="in-type">in {type}</span>{/if}
{/snippet}

<li {...rest} class={['search-term-row', { selected }]}>
  {#if href}
    <a class="reuse" {href} tabindex={tabbable ? undefined : -1} aria-current={selected ? 'page' : undefined}
      >{@render label()}</a>
  {:else}
    <button type="button" class="reuse" tabindex={tabbable ? undefined : -1} onclick={onpick}>{@render label()}</button>
  {/if}
  {#if onremove}
    <button type="button" class="remove" aria-label="Remove recent search: {query}" onclick={onremove}
      ><Icon svg={xmark} /></button>
  {/if}
</li>

<style>
/* Rounded, with a soft gray highlight from the arrows, the mouse or focus. */
.search-term-row {
  display: flex;
  align-items: center;
  border-radius: var(--radius-search-row);
  font-size: var(--font-size-base);
  list-style: none;
  transition: background-color 0.15s;

  &:is(.selected, :hover, :focus-within) {
    background-color: var(--color-search-row-hover);
  }

  & button {
    min-block-size: 0;
    border: 0;
    border-radius: 0;
    background: none;
    font: inherit;
    cursor: pointer;
  }
}

.reuse {
  display: flex;
  flex: 1;
  align-items: center;
  min-inline-size: 0;
  padding: var(--space-lg-block) var(--space-base-inline);
  color: var(--color-search-term);
  line-height: 1;
  text-align: start;
  text-decoration: none;
}

.icon-slot {
  display: inline-flex;
  margin-inline-end: var(--space-base-inline);
  color: var(--color-search-in-type);
}

.in-type {
  margin-inline-start: var(--space-xs-inline);
  color: var(--color-search-in-type);
}

/* The × stays out of the way until its row is pointed at, highlighted or focused. */
.remove {
  display: grid;
  place-items: center;
  padding: var(--space-sm-block) var(--space-base-inline);
  color: var(--color-search-term);
  opacity: 0;
  transition: opacity 0.15s;

  .search-term-row:is(:hover, :focus-within, .selected) & {
    opacity: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .search-term-row,
  .remove {
    transition: none;
  }
}
</style>
