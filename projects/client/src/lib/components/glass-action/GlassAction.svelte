<!--
  A labelled button on dark glass, for actions over artwork like the dashboard recommendation's. With `color` it's
  tinted in that action's color and turns solid once `selected`; without one it's plain black.
    <GlassAction icon={listThick} color="var(--brand-secondary)" selected={watchlisted} onclick={toggle}>
      Add to Watchlist
    </GlassAction>
  Anything else (`aria-*`, `popovertarget`, a `style` with an `anchor-name`) goes on the button.
-->
<script lang="ts">
import Spinner from '$lib/components/loading/Spinner.svelte';
import Icon from '$lib/icons/Icon.svelte';
import type { Snippet } from 'svelte';
import type { HTMLButtonAttributes } from 'svelte/elements';

interface Props extends Omit<HTMLButtonAttributes, 'color'> {
  icon: string;
  /** The action's color, as a CSS color. Left out, the button is black. */
  color?: string;
  selected?: boolean;
  /** Names the wait for screen readers, and shows a spinner in place of the icon. */
  busy?: string;
  children: Snippet;
}

const { icon, color, selected = false, busy, children, ...rest }: Props = $props();
</script>

<button type="button" {...rest} class={['glass-action', { tinted: color, selected }]} style:--action={color}
  aria-busy={busy ? 'true' : undefined}>
  {#if busy}<Spinner label={busy} />{:else}<span class="icon"><Icon svg={icon} /></span>{/if}
  {@render children()}
</button>

<style>
.glass-action {
  display: inline-flex;
  align-items: center;
  gap: var(--glass-action-gap);
  min-block-size: var(--glass-action-height);
  padding-inline: var(--glass-action-padding);
  border: 1px solid var(--color-glass-action-black-line);
  border-radius: var(--radius-control);
  background: var(--color-glass-action-black);
  color: var(--color-glass-action-text);
  font: inherit;
  font-size: var(--font-size-glass-action);
  font-weight: var(--font-weight-glass-action);
  white-space: nowrap;
  cursor: pointer;
  transition: background-color var(--transition-card);

  &:is(:hover, :focus-visible) {
    background: var(--color-glass-action-black-hover);
  }

  &[aria-busy='true'] {
    cursor: wait;
  }
}

/* Trakt-font glyphs sit a little high, as in the quick-icon bar. */
.icon {
  display: contents;
  --icon-shift: var(--quick-icon-trakt-shift);
}

.tinted {
  border-color: color-mix(in srgb, var(--action) var(--glass-action-line), transparent);
  background: color-mix(in srgb, var(--action) var(--glass-action-tint), var(--color-glass-action-bg));
  backdrop-filter: var(--blur-header-glass);

  &:is(:hover, :focus-visible) {
    background: color-mix(in srgb, var(--action) var(--glass-action-tint-hover), var(--color-glass-action-bg));
  }

  &.selected {
    background: var(--action);
  }
}

@media (prefers-reduced-motion: reduce) {
  .glass-action {
    transition: none;
  }
}
</style>
