<!--
  OG's funnel: slides the advanced filter panel
  out and back. Its caret points the way the panel will move, it turns red while filters are on, and `count` puts
  OG's `.filter-counter` badge on it. `a` toggles it too, except while typing .
    <AdvancedFiltersToggle bind:open controls="chart-filters" active count={3} />
-->
<script lang="ts">
import Tooltip from '$lib/components/tooltip/Tooltip.svelte';
import Icon from '$lib/icons/Icon.svelte';
import caretRight from '$lib/icons/solid/caret-right.svg?raw';
import filtersIcon from '$lib/icons/solid/filters.svg?raw';
import regularFilters from '$lib/icons/regular/filters.svg?raw';

interface Props {
  open: boolean;
  /** The panel's id. */
  controls: string;
  /** Filters are on: the funnel turns red. */
  active: boolean;
  /** Applied filters, badged when above 0. OG counted the sidebar's tags, which only VIPs got. */
  count: number;
  /** Lets the page hand focus back here when the panel closes. */
  button?: HTMLButtonElement;
  /** The regular-weight funnel of a sidebar's tool row, beside the regular eye. */
  regular?: boolean;
}

let { open = $bindable(), controls, active, count, button = $bindable(), regular = false }: Props = $props();

function onkeydown(event: KeyboardEvent) {
  if (event.key !== 'a' || event.altKey || event.ctrlKey || event.metaKey || event.defaultPrevented) return;
  if (event.target instanceof HTMLElement && event.target.closest('input, textarea, select, [contenteditable]')) return;
  event.preventDefault();
  open = !open;
}
</script>

<svelte:window {onkeydown} />

<Tooltip text="Advanced Filters">
  {#snippet trigger(tooltip)}
    <button
      bind:this={button}
      type="button"
      class={['toggle', { active, open, regular }]}
      aria-label={count > 0 ? `Advanced Filters (${count} on)` : 'Advanced Filters'}
      aria-expanded={open}
      aria-controls={controls}
      onclick={() => (open = !open)}
      {...tooltip}
    >
      <span class="funnel"><Icon svg={regular ? regularFilters : filtersIcon} />{#if count > 0}<span class="badge" aria-hidden="true"
          >{count.toLocaleString('en-US')}</span>{/if}</span><span class="caret"><Icon svg={caretRight} /></span>
    </button>
  {/snippet}
</Tooltip>

<style>
/* A toolbar tool like the filter eye beside it: a rounded square that fills on hover, with the caret pointing at
   the panel it opens. */
.toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-tool-caret);
  min-inline-size: var(--tool-size);
  min-block-size: var(--tool-size);
  margin-inline-end: calc(-1 * var(--filter-toggle-overhang));
  padding: 0 var(--space-tool-inline);
  border: 0;
  border-radius: var(--radius-control);
  background: none;
  color: var(--color-filter-icon-frame);
  font-size: var(--font-size-filter-icon-frame);
  line-height: 1;

  &:is(:hover, :focus-visible),
  &.open {
    background-color: var(--color-tool-hover-bg);
  }

  /* Beside a section toolbar's regular eye: its color, size and hover, and no overhang. */
  &.regular {
    margin-inline-end: 0;
    color: var(--color-tool);
    font-size: var(--font-size-tool);

    &:is(:hover, :focus-visible) {
      color: var(--color-tool-hover);
    }
  }

  &.active,
  &.regular.active {
    color: var(--brand-primary);
  }

  @media (prefers-reduced-motion: no-preference) {
    transition: color var(--transition-frame), background-color 0.2s;
  }
}

.funnel {
  position: relative;
  display: inline-flex;
}

.caret {
  display: inline-flex;
  color: var(--color-control-muted);
  font-size: var(--font-size-caret);
  transition: color 0.2s;

  .toggle:is(:hover, :focus-visible, .open, .active) & {
    color: currentcolor;
  }

  .open & {
    scale: -1 1;
  }
}

/* The count of filters that are on, over the funnel's top-right, like the eye's. */
.badge {
  position: absolute;
  inset-block-start: calc(var(--tool-badge-size) / -2);
  inset-inline-end: calc(var(--tool-badge-size) / -2);
  min-inline-size: var(--tool-badge-size);
  block-size: var(--tool-badge-size);
  padding-inline: var(--space-tool-badge);
  border-radius: var(--tool-badge-size);
  background-color: var(--brand-primary);
  color: var(--color-text-inverse);
  font-family: var(--font-headings);
  font-size: var(--font-size-tool-badge);
  font-weight: var(--font-weight-headings-heavy);
  line-height: var(--tool-badge-size);
  text-align: center;
  pointer-events: none;
}
</style>
