<!--
  One day of plays under OG's divider (`users.js:680-730`): a faint clock watermark, the weekday in bold and the date,
  with the day's runtime on the right in a list header's stat look. The heading is a button that collapses or expands
  the day's cards. With the dividers toggled off, pages skip this and lay every card out in one grid.
    <DayGroup weekday="Tuesday" date="September 29, 2026" runtime="2h 19m">...cards...</DayGroup>
-->
<script lang="ts">
import HeadingMark from '$lib/components/heading/HeadingMark.svelte';
import Icon from '$lib/icons/Icon.svelte';
import clock from '$lib/icons/regular/clock.svg?raw';
import type { Snippet } from 'svelte';

interface Props {
  weekday?: string;
  date: string;
  runtime?: string;
  children: Snippet;
}

const { weekday, date, runtime, children }: Props = $props();
let open = $state(true);
</script>

<div class="day">
  <h2 class="divider">
    <HeadingMark svg={clock} />
    <button type="button" aria-expanded={open} onclick={() => (open = !open)}>
      {#if weekday}<b>{weekday}</b>{/if} {date}
    </button>
    {#if runtime}<span class="runtime"><span class="icon"><Icon svg={clock} /></span><span class="hidden"
        >Watch time </span><strong>{runtime}</strong></span>{/if}
  </h2>
  {#if open}{@render children()}{/if}
</div>

<style>
.divider {
  position: relative;
  isolation: isolate;
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  padding-block-end: 2px;
  border-block-end: 1px solid var(--color-separator);

  & button {
    min-block-size: 0;
    padding: 0;
    border: 0;
    background: none;
    color: inherit;
    font: inherit;
    text-align: start;
    cursor: pointer;
  }
}

/* The day's runtime in a list header's stat look: the blue clock, then the time in bold. */
.runtime {
  display: inline-flex;
  align-items: center;
  font-family: var(--font-headings);
}

.icon {
  display: inline-flex;
  margin-inline-end: var(--space-stat);
  color: var(--color-stat-count);
  font-size: var(--font-size-stat-icon);
  line-height: 1;
}

.hidden {
  position: absolute;
  inline-size: 1px;
  block-size: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}

strong {
  color: var(--color-stat-number);
  font-size: var(--font-size-stat-number);
  font-weight: var(--font-weight-headings-heavy);
}
</style>
