<!--
  A SidebarFrame sidebar's Applied Filters: a folding section of removable chips with Clear all on the right. Only
  VIPs can remove chips, as OG kept filtering for VIPs. Its open state shares the `sidebar_filters` cookie on every page.
    <AppliedFiltersSection {chips} open={data.sidebar.filters} {vip} clearHref={page.url.pathname} onremove={remove} />
-->
<script lang="ts">
import SidebarSection from '$lib/components/sidebar/SidebarSection.svelte';
import FilterChips from './FilterChips.svelte';
import type { FilterTag } from './filterTags.ts';

interface Props {
  chips: readonly FilterTag[];
  open: boolean;
  vip: boolean;
  /** The page without any filters. */
  clearHref: string;
  onremove: (id: string) => void;
}

const { chips, open, vip, clearHref, onremove }: Props = $props();
</script>

<!-- The page builds the href from its own path, so resolve() has nothing to add. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->

<SidebarSection id="filters" title="Applied Filters" {open} remember>
  {#snippet action()}<a class="clear" href={clearHref}>Clear all</a>{/snippet}
  <FilterChips {chips} {onremove} disabled={!vip} />
</SidebarSection>

<style>
.clear {
  justify-self: start;
  padding: 3px var(--space-base-block);
  border: 1px solid var(--color-control-border);
  border-radius: var(--radius-control);
  background-color: var(--color-control-bg);
  color: var(--color-sidebar-pill-text);
  font-size: var(--font-size-small);
  font-weight: var(--font-weight-menu-header);
  text-decoration: none;

  &:is(:hover, :focus-visible) {
    border-color: var(--color-control-border-hover);
    color: var(--color-frame-text);
  }
}
</style>
