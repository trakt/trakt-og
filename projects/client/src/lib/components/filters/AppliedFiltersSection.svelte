<!--
  A SidebarFrame sidebar's Applied Filters: a folding section of removable chips, its title counting them so a folded
  one still says how many are on, with Clear on the right in the filter panel's Clear look at the sidebar's small
  size. Its open
  state shares the `sidebar_filters` cookie on every page.
    <AppliedFiltersSection {chips} open={data.sidebar.filters} clearHref={page.url.pathname} onremove={remove} />
-->
<script lang="ts">
import SidebarSection from '$lib/components/sidebar/SidebarSection.svelte';
import Icon from '$lib/icons/Icon.svelte';
import resetIcon from '$lib/icons/regular/arrow-rotate-left.svg?raw';
import { countLabel } from '$lib/utils/countLabel';
import FilterChips from './FilterChips.svelte';
import type { FilterTag } from './filterTags.ts';

interface Props {
  chips: readonly FilterTag[];
  open: boolean;
  /** The page without any filters. */
  clearHref: string;
  onremove: (id: string) => void;
}

const { chips, open, clearHref, onremove }: Props = $props();
</script>

<!-- The page builds the href from its own path, so resolve() has nothing to add. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->

<SidebarSection id="filters" title={countLabel(chips.length, 'Applied Filter')} {open} remember>
  {#snippet action()}<a class="clear" href={clearHref}><Icon svg={resetIcon} />Clear</a>{/snippet}
  <FilterChips {chips} {onremove} />
</SidebarSection>

<style>
/* The filter panel's Clear and Close: an outline on the raised control fill, its icon muted. */
.clear {
  display: inline-flex;
  align-items: center;
  justify-self: start;
  gap: var(--space-xs-inline);
  min-block-size: var(--control-height-mini);
  padding: 0 var(--space-base-block);
  border: 1px solid var(--color-control-border);
  border-radius: var(--radius-control);
  background-color: var(--color-control-raised-bg);
  color: var(--color-control-text);
  font-family: var(--font-headings);
  font-size: var(--font-size-small);
  font-weight: var(--font-weight-control);
  text-decoration: none;
  transition: background-color 0.2s, border-color 0.2s;

  & :global(.icon) {
    color: var(--color-control-muted);
  }

  &:is(:hover, :focus-visible) {
    border-color: var(--color-control-border-hover);
    background-color: var(--color-control-raised-hover-bg);
  }
}
</style>
