<!--
  A page with a sticky sidebar that holds all of its controls, an optional slide-in panel (the filters) and the content,
  which holds nothing else. The calendar uses it first; it's built so other pages can move to the same pattern.
    <SidebarFrame label="Calendar" collapsed={data.sidebarCollapsed} {panelOpen}>
      {#snippet sidebar()}…{/snippet}
      {#snippet rail()}…{/snippet}
      {#snippet panel()}<FiltersPanel … />{/snippet}
      …content…
    </SidebarFrame>
  Collapsed, the sidebar becomes a slim rail: a button to bring it back, then the page's `rail` snippet. A tab on the
  sidebar's right edge (shown on hover and focus) and the `[` key toggle it, and the choice is kept for a year in the
  `sidebar_collapsed` cookie, so the loader can render it the same way. The panel opens between the sidebar and the
  content and pushes the content over, like OG's advanced filters. Under 768px everything stacks and doesn't collapse.
-->
<script lang="ts">
import Icon from '$lib/icons/Icon.svelte';
import chevronLeft from '$lib/icons/regular/chevron-left.svg?raw';
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
          <button type="button" class="show" title="Show sidebar ( [ )" onclick={toggle}>
            <Icon svg={sidebarIcon} label="Show sidebar" />
          </button>
          {@render rail?.()}
        </div>
      {:else}
        <button type="button" class="edge-tab" title="Hide sidebar ( [ )" onclick={toggle}>
          <Icon svg={chevronLeft} label="Hide sidebar" />
        </button>
        <div class="scroll">{@render sidebar()}</div>
      {/if}
    </div>
  </aside>
  {#if panel}
    <div class="panel">{@render panel()}</div>
  {/if}
  <div class="content">{@render children()}</div>
</div>

<style>
.sidebar-frame {
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
  padding-block-start: var(--header-height);

  @media (min-width: 768px) {
    position: sticky;
    inset-block-start: 0;
  }
}

.scroll {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  align-content: start;
  gap: var(--sidebar-gap);
  padding: var(--sidebar-padding);

  @media (min-width: 768px) {
    max-block-size: calc(100vh - var(--header-height));
    overflow-y: auto;
    scrollbar-width: thin;
  }
}

.rail {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-block: var(--space-base-inline) var(--sidebar-padding);
}

.show,
.edge-tab {
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

/* On the sidebar's right edge, near the top. It shows while the pointer or focus is in the sidebar. */
.edge-tab {
  position: absolute;
  inset-block-start: calc(var(--header-height) + var(--sidebar-edge-tab-top));
  inset-inline-end: calc(var(--sidebar-edge-tab) / -2);
  z-index: 1;
  inline-size: var(--sidebar-edge-tab);
  block-size: var(--sidebar-edge-tab);
  border: 1px solid var(--color-control-border);
  border-radius: 50%;
  background-color: var(--color-frame);
  font-size: var(--font-size-small);
  box-shadow: var(--shadow-sidebar-edge-tab);
  opacity: 0;

  .sidebar:is(:hover, :focus-within) & {
    opacity: 1;
  }

  &:is(:hover, :focus-visible) {
    border-color: var(--color-control-border-hover);
  }

  @media (max-width: 767px) {
    display: none;
  }
}

.panel {
  min-inline-size: 0;
}

.content {
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

  .edge-tab {
    transition: opacity var(--transition-card), border-color var(--transition-card);
  }
}
</style>
