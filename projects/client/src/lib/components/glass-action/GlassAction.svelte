<!--
  A labelled button on dark glass, for actions over artwork like the dashboard recommendation's. With `color` it's
  tinted in that action's color and turns solid once `selected`; without one it's plain black.
    <GlassAction icon={listThick} color="var(--brand-secondary)" selected={watchlisted} onclick={toggle}>
      Add to Watchlist
    </GlassAction>
  Anything else (`aria-*`, `popovertarget`, a `style` with an `anchor-name`) goes on the button. `glass` swaps the
  black for the dark dropdown trigger's colors, see-through, for over a summary's fanart. With `href` it's a link
  instead ("All Stats"), and `presentational` draws it without a control of its own, for inside another one's trigger
  (the ratings strip's Rate, inside the rating popover's button). `card` is the page's outlined control instead, as
  tall and padded as View seasons, for a list row's Like and a comment's React and Reply; a selected tinted one stays
  solid. Without `icon`, the label leads (a comment's chosen reaction brings its emoji).
-->
<script lang="ts">
import Spinner from '$lib/components/loading/Spinner.svelte';
import Icon from '$lib/icons/Icon.svelte';
import type { Snippet } from 'svelte';
import type { HTMLButtonAttributes } from 'svelte/elements';

interface Props extends Omit<HTMLButtonAttributes, 'color'> {
  icon?: string;
  /** The action's color, as a CSS color. Left out, the button is black. */
  color?: string;
  selected?: boolean;
  /** Names the wait for screen readers, and shows a spinner in place of the icon. */
  busy?: string;
  /** A link to this page instead of a button. */
  href?: string;
  /** Only the look, for inside another control. */
  presentational?: boolean;
  /** Frosted rather than black, when it has no color. */
  glass?: boolean;
  /** The icon's own color on the frosted glass, in place of its muted gray: the list Like's blue thumb. */
  iconColor?: string;
  /** The page's outlined control, off the artwork. */
  card?: boolean;
  children: Snippet;
}

const {
  icon,
  color,
  selected = false,
  busy,
  href,
  presentational = false,
  glass = false,
  iconColor,
  card = false,
  children,
  ...rest
}: Props = $props();
const classes = $derived(['glass-action', { glass, tinted: color, selected, card }]);
</script>

{#snippet body()}
  {#if busy}<Spinner label={busy} />{:else if icon}<span class="icon"><Icon svg={icon} /></span>{/if}
  {@render children()}
{/snippet}

<!-- The href comes in as a prop, and resolve() only takes literal routes. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->

{#if href}
  <a {href} class={classes} style:--action={color}>{@render body()}</a>
{:else if presentational}
  <span class={classes} style:--action={color} style:--glass-action-icon={iconColor}>{@render body()}</span>
{:else}
  <button type="button" {...rest} class={classes} style:--action={color} style:--glass-action-icon={iconColor}
  aria-busy={busy ? 'true' : undefined}>
    {@render body()}
  </button>
{/if}

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
  text-decoration: none;
  white-space: nowrap;
  cursor: pointer;
  transition: background-color var(--transition-card);

  &:is(:hover, :focus-visible) {
    background: var(--color-glass-action-black-hover);
    color: var(--color-glass-action-text);
    text-decoration: none;
  }

  &[aria-busy='true'] {
    cursor: wait;
  }
}

/* In the dark dropdown trigger's colors, see-through, so it sits quietly in the art: a muted icon, a brighter
   border on hover. */
.glass {
  border-color: var(--color-glass-action-glass-line);
  background: var(--color-glass-action-glass);
  backdrop-filter: var(--blur-header-glass);

  & .icon {
    color: var(--glass-action-icon, var(--color-glass-action-glass-icon));
  }

  &:is(:hover, :focus-visible) {
    border-color: var(--color-glass-action-glass-line-hover);
    background: var(--color-glass-action-glass-hover);
  }
}

/* Off its artwork: the page's outlined control, in its colors, padding and type. A selected tinted one stays solid. */
.card {
  gap: var(--glass-action-gap-card);
  min-block-size: var(--control-height);
  padding-inline: var(--glass-action-padding-card);
  backdrop-filter: none;
  font-family: var(--font-body);
  font-weight: var(--font-weight-glass-action-card);
}

.card:not(.selected) {
  --color-glass-action-glass: var(--color-control-bg);
  --color-glass-action-glass-hover: var(--color-control-hover-bg);
  --color-glass-action-glass-line: var(--color-control-border);
  --color-glass-action-glass-line-hover: var(--color-control-border-hover);
  --color-glass-action-text: var(--color-control-text);
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
