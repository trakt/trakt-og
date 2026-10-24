<!--
  A group in a collapsed SidebarFrame's rail: its items stacked and centered, a rule above every group but the first.
  `tools` sizes the page's tools (the fade/hide eye, the filter toggle) to the rail's width.
    <RailGroup tools><FadeHideMenu … /><AdvancedFiltersToggle … /></RailGroup>
-->
<script lang="ts">
import type { Snippet } from 'svelte';

interface Props {
  tools?: boolean;
  children: Snippet;
}

const { tools = false, children }: Props = $props();
</script>

<div class={['rail-group', { tools }]}>{@render children()}</div>

<style>
.rail-group {
  display: flex;
  flex: none;
  flex-direction: column;
  align-items: center;
  gap: var(--space-base-block);
  inline-size: 100%;
  padding-block: var(--space-base-inline);
  border-block-start: 1px solid var(--color-sidebar-rule);

  &:first-child {
    padding-block-start: 0;
    border-block-start: 0;
  }
}

.tools {
  gap: var(--space-xs-inline);

  & :global(:is(.trigger, .toggle)) {
    inline-size: var(--rail-tool-width);
    justify-content: center;
  }
}
</style>
