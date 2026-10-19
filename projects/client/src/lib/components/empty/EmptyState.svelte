<!--
  An empty state that reads as a gap, not a row: a dashed, rounded outline with a muted icon, one line, and an optional
  way out: an item's lists page, the dashboard schedule, and (`compact`, a sidebar's size) the charts sidebar's "No one
  is watching". OG's gray `NoData` box stays where OG had it.
    <EmptyState icon={list} action={{ href: '/movies/holes-2003/lists/all', text: 'See all lists' }}>
      No official lists feature Holes.
    </EmptyState>
-->
<script lang="ts">
import Icon from '$lib/icons/Icon.svelte';
import type { Snippet } from 'svelte';

interface Props {
  /** Raw SVG above the line. */
  icon?: string;
  /** A link out of the empty state: to a wider filter, say. */
  action?: { readonly href: string; readonly text: string };
  /** Tighter and smaller, for a sidebar. */
  compact?: boolean;
  children: Snippet;
}

const { icon, action, compact = false, children }: Props = $props();
</script>

<!-- The action's href comes in as a prop; resolve() only takes literal routes. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->
<div class={['empty-state', { compact }]}>
  {#if icon}<span class="icon"><Icon svg={icon} /></span>{/if}
  <p>{@render children()}</p>
  {#if action}<a href={action.href}>{action.text}</a>{/if}
</div>

<style>
.empty-state {
  display: grid;
  justify-items: center;
  gap: var(--empty-state-gap);
  padding: var(--empty-state-padding);
  border: 1px dashed var(--color-empty-state-border);
  border-radius: var(--radius-empty-state);
  color: var(--color-empty-state-text);
  font-family: var(--font-headings);
  text-align: center;

  &.compact {
    padding: var(--empty-state-padding-compact);
    border-radius: var(--radius-control);

    & p {
      font-size: var(--font-size-control);
    }
  }
}

.icon {
  display: inline-flex;
  font-size: var(--font-size-empty-state-icon);
}

p {
  margin: 0;
  font-size: var(--font-size-empty-state);
  text-wrap: balance;
}

a {
  color: var(--color-link);
  font-weight: var(--font-weight-headings);

  &:is(:hover, :focus-visible) {
    text-decoration: underline;
  }
}
</style>
