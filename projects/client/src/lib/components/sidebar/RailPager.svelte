<!--
  A collapsed SidebarFrame rail's pager: back, a short label ("Oct", "P2"), forward. A step with nowhere to go is left
  out.
    <RailPager unit="month" label="Oct" {prevHref} {nextHref} />
-->
<script lang="ts">
import Icon from '$lib/icons/Icon.svelte';
import angleLeft from '$lib/icons/light/angle-left.svg?raw';
import angleRight from '$lib/icons/light/angle-right.svg?raw';

interface Props {
  /** What a step moves by: "Previous month", "Next page". */
  unit: string;
  label: string;
  prevHref?: string;
  nextHref?: string;
}

const { unit, label, prevHref, nextHref }: Props = $props();
</script>

<!-- The hrefs keep the current path and query, so resolve() has nothing to add. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->

<div class="rail-pager">
  {#if prevHref}<a href={prevHref} rel="prev"><Icon svg={angleLeft} label="Previous {unit}" /></a>{/if}
  <span>{label}</span>
  {#if nextHref}<a href={nextHref} rel="next"><Icon svg={angleRight} label="Next {unit}" /></a>{/if}
</div>

<style>
.rail-pager {
  display: flex;
  align-items: center;
  gap: var(--space-xs-inline);
  font-size: var(--font-size-small);
  font-weight: var(--font-weight-headings-heavy);
  text-transform: uppercase;

  & a {
    padding: var(--space-xs-inline) 1px;
    border-radius: var(--radius-control);
    color: var(--color-sidebar-label);

    &:is(:hover, :focus-visible) {
      color: var(--color-frame-ink);
    }
  }
}
</style>
