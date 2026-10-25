<!--
  A SidebarFrame sidebar's first row: the page's h1, usually a `variant="title"` Dropdown that picks the page, with the
  page's tools (the fade/hide eye, the filter toggle) on the right, level with the title's name.
    <SidebarTitle>
      {#snippet heading()}<Dropdown variant="title" label="Pick a chart">…</Dropdown>{/snippet}
      {#snippet tools()}<FadeHideMenu … /><AdvancedFiltersToggle … />{/snippet}
    </SidebarTitle>
-->
<script lang="ts">
import type { Snippet } from 'svelte';

interface Props {
  heading: Snippet;
  tools?: Snippet;
}

const { heading, tools }: Props = $props();
</script>

<div class="sidebar-title">
  <h1>{@render heading()}</h1>
  {#if tools}<div class="tools">{@render tools()}</div>{/if}
</div>

<style>
.sidebar-title {
  display: flex;
  align-items: flex-end;
  gap: var(--space-base-block);

  & h1 {
    flex: 1;
    min-inline-size: 0;
    margin: 0;
    font-size: inherit;
  }
}

.tools {
  display: flex;
  flex: none;
  gap: var(--space-tools);
  margin-block-end: -4px;
}
</style>
