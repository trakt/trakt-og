<!--
  A page with a sticky sidebar that holds all of its controls, an optional slide-in panel (the filters) and the content,
  which holds nothing else. The calendar uses it first; it's built so other pages can move to the same pattern.
    <SidebarFrame label="Calendar" collapsed={data.sidebarCollapsed} {panelOpen}>
      {#snippet sidebar()}…{/snippet}
      {#snippet rail()}…{/snippet}
      {#snippet panel()}<FiltersPanel … />{/snippet}
      …content…
    </SidebarFrame>
  Collapsed, the sidebar becomes a slim rail: the page's `rail` snippet, with a button to bring it back pinned to the
  bottom where Collapse was. A Collapse
  button pinned to the sidebar's bottom (like Trakt admin's) and the `[` key toggle it, and the choice is kept for a year in the
  `sidebar_collapsed` cookie, so the loader can render it the same way. The panel opens between the sidebar and the
  content and pushes the content over, like OG's advanced filters. Under 768px everything stacks and doesn't collapse.
-->
<script lang="ts">
import Icon from '$lib/icons/Icon.svelte';
import sidebarIcon from '$lib/icons/regular/sidebar.svg?raw';
import type { Snippet } from 'svelte';

interface Props {
  /** Names the sidebar landmark. */
  label: string;
  /** Starts collapsed: the `sidebar_collapsed` cookie, read by the loader. */
  collapsed?: boolean;
  sidebar: Snippet;
  /** The collapsed rail's content, under the button that brings the sidebar back. */
  rail?: Snippet;
  panel?: Snippet;
  panelOpen?: boolean;
  children: Snippet;
}

const { label, collapsed = false, sidebar, rail, panel, panelOpen = false, children }: Props = $props();

let hidden = $derived(collapsed);

function toggle() {
  hidden = !hidden;
  document.cookie = `sidebar_collapsed=1; path=/; samesite=lax; max-age=${hidden ? 31_536_000 : 0}`;
}

function onkeydown(event: KeyboardEvent) {
  if (event.key !== '[' || event.altKey || event.ctrlKey || event.metaKey || event.defaultPrevented) return;
  if (event.target instanceof HTMLElement && event.target.closest('input, textarea, select, [contenteditable]')) return;
  event.preventDefault();
  toggle();
}
</script>

<svelte:window {onkeydown} />

<div class={['sidebar-frame', { collapsed: hidden, 'has-panel': panel, 'panel-open': panel && panelOpen }]}>
  <aside class="sidebar" aria-label={label}>
    <div class="inner">
      {#if hidden}
        <div class="rail">
          {@render rail?.()}
          <button type="button" class="show" title="Show sidebar ( [ )" onclick={toggle}>
            <Icon svg={sidebarIcon} label="Show sidebar" />
          </button>
        </div>
      {:else}
        <div class="scroll">{@render sidebar()}</div>
        <button type="button" class="collapse" title="Collapse the sidebar ( [ )" onclick={toggle}>
          <Icon svg={sidebarIcon} />Collapse
        </button>
      {/if}
    </div>
  </aside>
  {#if panel}
    <div class="panel">{@render panel()}</div>
  {/if}
  <div class="content">{@render children()}</div>
</div>

<style>
/* Dark in both themes, like the chart frame, so its controls take their dark values. */
.sidebar-frame {
  color-scheme: dark;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  background-color: var(--color-frame);
  color: var(--color-frame-text);

  @media (min-width: 768px) {
    grid-template-columns: var(--sidebar-width) minmax(0, 1fr);

    &.has-panel {
      grid-template-columns: var(--sidebar-width) 0 minmax(0, 1fr);
      overflow-x: clip;
    }

    &.panel-open {
      grid-template-columns: var(--sidebar-width) var(--sidebar-panel-width) minmax(0, 1fr);
    }

    &.collapsed {
      grid-template-columns: var(--sidebar-rail-width) minmax(0, 1fr);

      &.has-panel {
        grid-template-columns: var(--sidebar-rail-width) 0 minmax(0, 1fr);
      }

      &.panel-open {
        grid-template-columns: var(--sidebar-rail-width) var(--sidebar-panel-width) minmax(0, 1fr);
      }
    }
  }
}

.sidebar {
  position: relative;
  z-index: 2;
  min-inline-size: 0;
  border-inline-end: 1px solid var(--color-frame-border);
}

.inner {
  position: relative;
  display: flex;
  flex-direction: column;
  padding-block-start: var(--header-height);

  /* The full height of the window, so Collapse sits at the bottom however short the sidebar is. */
  @media (min-width: 768px) {
    position: sticky;
    inset-block-start: 0;
    block-size: 100vh;
  }
}

.scroll {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  align-content: start;
  gap: var(--sidebar-gap);
  padding: var(--sidebar-padding);

  @media (min-width: 768px) {
    flex: 1;
    min-block-size: 0;
    overflow-y: auto;
    scrollbar-width: thin;
  }
}

.collapse {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: var(--space-sm-inline);
  margin-inline: var(--sidebar-padding);
  padding: var(--space-base-inline) var(--space-xs-inline);
  border: 0;
  border-block-start: 1px solid var(--color-sidebar-rule);
  background: none;
  color: var(--color-tool);
  font: inherit;
  font-size: var(--font-size-control);
  cursor: pointer;

  &:is(:hover, :focus-visible) {
    color: var(--color-tool-hover);
  }

  & :global(.icon) {
    font-size: var(--font-size-tool);
  }

  @media (max-width: 767px) {
    display: none;
  }
}

.rail {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  min-block-size: 0;
  padding-block-start: var(--space-base-inline);
}

.show {
  margin-block: auto var(--space-base-inline);
  display: grid;
  place-items: center;
  min-block-size: 0;
  padding: 0;
  border: 0;
  background: none;
  color: var(--color-tool);
  cursor: pointer;

  &:is(:hover, :focus-visible) {
    color: var(--color-tool-hover);
  }
}

.show {
  inline-size: var(--tool-size);
  block-size: var(--tool-size);
  border-radius: var(--radius-control);
  font-size: var(--font-size-tool);

  &:is(:hover, :focus-visible) {
    background-color: var(--color-tool-hover-bg);
  }
}

.panel {
  display: grid;
  min-inline-size: 0;
}

.content {
  /* Its pinned day bars stack among themselves, under the sidebar. */
  isolation: isolate;
  min-inline-size: 0;

  @media (min-width: 768px) {
    min-block-size: calc(100vh - var(--header-height));
    margin-block-start: var(--header-height);

    /* The content keeps its width and runs off the right edge while the panel is open, like OG's. */
    .panel-open & {
      margin-inline-end: calc(-1 * var(--sidebar-panel-width));
    }
  }
}

@media (prefers-reduced-motion: no-preference) {
  .sidebar-frame {
    transition: grid-template-columns var(--transition-frame);
  }

  .content {
    transition: margin-inline-end var(--transition-frame);
  }
}
</style>
