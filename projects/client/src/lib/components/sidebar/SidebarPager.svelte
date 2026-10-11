<!--
  A SidebarFrame sidebar's pager: back, where you are as a full-width menu, forward. The steps and menu rows are links,
  so paging is plain navigation; a step with nowhere to go shows dimmed. MonthPager and PagePager fill it.
    <SidebarPager unit="page" label="Page 2 of 20" menuLabel="Pick a page" {prevHref} {nextHref}>
      <ul><li><a href="?page=3">Page 3</a></li></ul>
    </SidebarPager>
-->
<script lang="ts">
import Dropdown from '$lib/components/dropdown/Dropdown.svelte';
import Icon from '$lib/icons/Icon.svelte';
import angleLeft from '$lib/icons/light/angle-left.svg?raw';
import angleRight from '$lib/icons/light/angle-right.svg?raw';
import type { Snippet } from 'svelte';

interface Props {
  /** What a step moves by: "Previous month", "Next page". */
  unit: string;
  /** The trigger: "October 2026", "Page 2 of 20". */
  label: string;
  /** Names the menu. */
  menuLabel: string;
  prevHref?: string;
  nextHref?: string;
  /** The menu's rows. */
  children: Snippet;
}

const { unit, label, menuLabel, prevHref, nextHref, children }: Props = $props();
const name = (word: string) => `${word} ${unit}`;
</script>

<!-- The hrefs keep the current path and query, so resolve() has nothing to add. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->

{#snippet step(href: string | undefined, rel: 'prev' | 'next')}
  {@const text = name(rel === 'prev' ? 'Previous' : 'Next')}
  {@const icon = rel === 'prev' ? angleLeft : angleRight}
  {#if href}
    <a class="step" {href} {rel}><Icon svg={icon} label={text} /></a>
  {:else}
    <span class="step" aria-disabled="true"><Icon svg={icon} label={text} /></span>
  {/if}
{/snippet}

<nav class="sidebar-pager" aria-label={unit[0]?.toUpperCase() + unit.slice(1)}>
  {@render step(prevHref, 'prev')}
  <Dropdown block label={menuLabel}>
    {#snippet trigger()}{label}{/snippet}
    {@render children()}
  </Dropdown>
  {@render step(nextHref, 'next')}
</nav>

<style>
.sidebar-pager {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: var(--space-xs-inline);

  & :global(.trigger) {
    font-weight: var(--font-weight-headings-heavy);
  }
}

.step {
  display: grid;
  place-items: center;
  inline-size: var(--control-height);
  block-size: var(--control-height);
  border: 1px solid var(--color-control-border);
  border-radius: var(--radius-control);
  background-color: var(--color-control-bg);
  color: var(--color-control-text);
  font-size: var(--font-size-base);

  &:is(a):is(:hover, :focus-visible) {
    border-color: var(--color-control-border-hover);
    background-color: var(--color-control-hover-bg);
  }

  &[aria-disabled='true'] {
    color: var(--color-frame-disabled);
  }
}
</style>
