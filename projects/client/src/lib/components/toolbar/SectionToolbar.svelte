<!--
  The toolbar under a profile or list subnav, on one line: the filters on the left, then the stats, then the summary
  (sort, view and filter tools) on the right. Under 992px its dropdowns hide their `section` names on screen.
    <SectionToolbar>
      {#snippet filters()}<Dropdown>…</Dropdown>{/snippet}
      {#snippet stats()}<SubnavCount … />{/snippet}
      {#snippet summary()}<Dropdown joined>…</Dropdown><SortDirection joined />{/snippet}
    </SectionToolbar>
  A bar with a lot of stats passes `statsChip`, its headline stat: under 992px the stats fold behind a chip showing it,
  and open under it as a menu, in their usual row, never wrapped: pulled left when it would run off the screen. They
  render once, so a stat's buttons and loading stay single.
    <SectionToolbar statsChip={{ svg: check, value: '53%', label: 'Watched', tone: 'watched' }} …>
-->
<script lang="ts">
import Container from '$lib/components/container/Container.svelte';
import Caret from '$lib/components/dropdown/Caret.svelte';
import { menuPlacement } from '$lib/components/dropdown/menuPlacement';
import Icon from '$lib/icons/Icon.svelte';
import type { Snippet } from 'svelte';
import type { Attachment } from 'svelte/attachments';

interface StatsChip {
  readonly svg: string;
  readonly value: string;
  /** What the value is ("Watched"), for screen readers. */
  readonly label: string;
  readonly tone?: 'watched' | 'collected' | 'count';
}

interface Props {
  filters: Snippet;
  stats?: Snippet;
  summary?: Snippet;
  inSummary?: boolean;
  statsChip?: StatsChip;
}

const { filters, stats, summary, inSummary = false, statsChip }: Props = $props();
const id = $props.id();
let pinned = $state<{ top: number; left: number }>();

// Placed before it shows, then again with its real width, and as the page scrolls or resizes.
const pinUnderChip: Attachment<HTMLElement> = (menu) => {
  const chip = menu.previousElementSibling;
  if (!(chip instanceof HTMLElement)) return;
  const place = (event?: Event) => {
    const opening = event instanceof ToggleEvent ? event.newState === 'open' : menu.matches(':popover-open');
    if (!opening) return;
    pinned = menuPlacement({
      trigger: chip.getBoundingClientRect(),
      menu: { width: menu.offsetWidth, height: menu.offsetHeight },
      viewport: { width: document.documentElement.clientWidth, height: innerHeight },
      offset: parseFloat(getComputedStyle(menu).getPropertyValue('--space-menu-offset')) || 0,
    });
  };
  menu.addEventListener('beforetoggle', place);
  menu.addEventListener('toggle', place);
  addEventListener('scroll', place, { capture: true, passive: true });
  addEventListener('resize', place);
  return () => {
    menu.removeEventListener('beforetoggle', place);
    menu.removeEventListener('toggle', place);
    removeEventListener('scroll', place, { capture: true });
    removeEventListener('resize', place);
  };
};
</script>

<section class="section-toolbar" aria-label="Page filters">
  <Container>
    <div class={['toolbar', { 'in-summary': inSummary }]}>
      <div class="filters">{@render filters()}</div>
      {#if stats && statsChip}
        <button type="button" class={['stats-chip', statsChip.tone ?? 'count']} popovertarget="{id}-stats"
          aria-label="{statsChip.label} {statsChip.value}, all stats"
          ><Icon svg={statsChip.svg} /><strong>{statsChip.value}</strong><Caret /></button>
        <div id="{id}-stats" class="stats folds" popover="auto" style:--menu-top={pinned && `${pinned.top}px`}
          style:--menu-left={pinned && `${pinned.left}px`} {@attach pinUnderChip}>
          {@render stats()}
        </div>
      {:else if stats}
        <div class="stats">{@render stats()}</div>
      {/if}
      {#if summary}<div class="summary">{@render summary()}</div>{/if}
    </div>
  </Container>
</section>

<style>
.section-toolbar {
  padding-block: var(--toolbar-padding);
  background: var(--color-toolbar-bg);
}
.toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--toolbar-gap);
}
.in-summary {
  margin-inline-start: var(--summary-offset);
  @media (width < 992px) {
    margin-inline-start: var(--summary-offset-sm);
  }
  @media (width < 768px) {
    margin-inline-start: 0;
  }
}
.filters,
.stats,
.summary {
  display: flex;
  align-items: center;
  gap: var(--toolbar-gap);
}
/* The filters push the stats and the summary to the right. */
.filters {
  margin-inline-end: auto;
}
.stats {
  gap: var(--space-stats);
}
/* Wide, the folding stats sit in the bar like any others: none of a popover's own look. */
.stats.folds {
  position: static;
  inset: auto;
  margin: 0;
  padding: 0;
  overflow: visible;
  border: 0;
  background: none;
  color: inherit;
}
.stats-chip {
  display: none;
}
/* On the smallest tablets the dropdowns drop their "Status:" and "Sort:" names to keep the bar on one line. Screen
   readers still hear them. */
@media (width < 992px) {
  .toolbar :global(.trigger:not(.block) .section) {
    position: absolute;
    inline-size: 1px;
    block-size: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }

  /* A dropdown trigger's look, with the headline stat as its value. */
  .stats-chip {
    display: inline-flex;
    align-items: center;
    gap: var(--space-stat);
    min-block-size: var(--control-height);
    padding: 0 calc(var(--space-control-inline) - 2px) 0 var(--space-control-inline);
    border: 1px solid var(--color-control-border);
    border-radius: var(--radius-control);
    background-color: var(--color-control-bg);
    color: var(--color-stat-count);
    font-family: var(--font-headings);
    line-height: 1;
    white-space: nowrap;
    transition: background-color 0.2s, border-color 0.2s;

    &.watched {
      color: var(--color-stat-watched);
    }

    &.collected {
      color: var(--color-stat-collected);
    }

    & :global(.icon) {
      font-size: var(--font-size-stat-icon);
    }

    & strong {
      color: var(--color-stat-number);
      font-size: var(--font-size-stat-number);
      font-weight: var(--font-weight-headings-heavy);
    }

    &:hover,
    &:has(+ .stats:popover-open) {
      --caret-color: var(--color-control-text);
      border-color: var(--color-control-border-hover);
      background-color: var(--color-control-hover-bg);
    }
  }

  /* The stats under the chip as a menu: the same row the bar shows when wide. */
  .stats.folds {
    position: fixed;
    inset-block-start: var(--menu-top, 0);
    inset-inline-start: var(--menu-left, 0);
    inline-size: max-content;
    padding: var(--toolbar-stats-menu-padding);
    border: 1px solid var(--color-menu-border);
    border-radius: var(--radius-menu);
    background-color: var(--color-menu-bg);
    box-shadow: var(--shadow-menu);

    &:not(:popover-open) {
      display: none;
    }
  }
}
</style>
