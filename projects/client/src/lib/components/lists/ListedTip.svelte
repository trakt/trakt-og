<!--
  The list button's tooltip once the title is on a list, laid out like the watched tooltip: "On 3 lists" over a line
  per list in its footer, the watchlist first, then the viewer's own lists and the ones they collaborate on. Past six
  lines the last one counts the rest. Each name opens its list in a new tab; keyboard users reach the same links in
  the picker, so the names stay out of the tab order.
    <Tooltip content={tip}>{#snippet tip()}<ListedTip user={slug} watchlisted lists={state.lists} />{/snippet}</Tooltip>
-->
<script lang="ts">
import TooltipFooter from '$lib/components/tooltip/TooltipFooter.svelte';
import type { ListLabel } from '$lib/overlay/ListLabel';

interface Props {
  /** The viewer's slug, for the watchlist's link. */
  user: string;
  watchlisted: boolean;
  lists: readonly ListLabel[];
}

const { user, watchlisted, lists }: Props = $props();

const MAX_ROWS = 6;
const rows = $derived([
  ...(watchlisted ? [{ key: 'watchlist', name: 'Watchlist', href: `/users/${user}/watchlist` }] : []),
  ...lists.map((list) => ({ key: String(list.id), name: list.name, href: `/lists/${list.id}` })),
]);
const shown = $derived(rows.length > MAX_ROWS ? rows.slice(0, MAX_ROWS - 1) : rows);
const rest = $derived(rows.length - shown.length);
</script>

<!-- List links use list ids and the viewer's canonical slug, like the picker's. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->
<span class="listed-tip">
  <span class="count">On <b>{rows.length}</b> {rows.length === 1 ? 'list' : 'lists'}</span>
  <TooltipFooter>
    <span class="rows">
      {#each shown as row (row.key)}
        <a href={row.href} target="_blank" rel="noopener" tabindex="-1">{row.name}</a>
      {/each}
      {#if rest}<span class="more">+{rest} more</span>{/if}
    </span>
  </TooltipFooter>
</span>

<style>
.listed-tip {
  display: grid;
}

.count {
  padding: var(--space-tooltip-rich);

  & b {
    font-weight: var(--font-weight-headings-heavy);
  }
}

.rows {
  display: grid;
  gap: var(--space-tooltip-list-row);
}

a {
  color: inherit;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
}

.more {
  color: var(--color-tooltip-muted);
}
</style>
