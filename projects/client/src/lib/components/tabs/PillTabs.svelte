<!--
  Pill tabs over a panel, in Discover's toggle chip look (og's control border, background and radius), the active one
  washed red with a red border. An optional count sits in a badge inside the pill, solid red on the active one. The
  summary pages use them for comments, lists and cast.
  An ARIA tablist: arrow keys, Home and End move between tabs and select them, Tab goes on into the panel.
  Set `--pill-tabs-justify` to move the pills along their row.
    <PillTabs label="Comments" tabs={[{ id: 'recent', label: 'Recent' }]} bind:selected>
      {#snippet panel(id)}...{/snippet}
    </PillTabs>
-->
<script lang="ts">
import type { Snippet } from 'svelte';
import { nextTab } from './nextTab.ts';

interface Tab {
  readonly id: string;
  readonly label: string;
  readonly count?: string | number;
}

interface Props {
  tabs: readonly Tab[];
  /** Names the tablist for screen readers, usually the heading the tabs sit under. */
  label: string;
  selected?: string;
  panel: Snippet<[string]>;
}

let { tabs, label, selected = $bindable(tabs[0]?.id), panel }: Props = $props();
const id = $props.id();

function onkeydown(event: KeyboardEvent) {
  const target = nextTab(tabs.map((tab) => tab.id), selected, event.key);
  if (target === undefined) return;

  event.preventDefault();
  selected = target;
  document.getElementById(`${id}-tab-${target}`)?.focus();
}
</script>

<div class="tabs" role="tablist" aria-label={label}>
  {#each tabs as tab (tab.id)}
    <button
      type="button"
      role="tab"
      id="{id}-tab-{tab.id}"
      aria-controls="{id}-panel"
      aria-selected={tab.id === selected}
      tabindex={tab.id === selected ? 0 : -1}
      onclick={() => (selected = tab.id)}
      {onkeydown}
    >
      {tab.label}
      {#if tab.count !== undefined}<span class="count">{tab.count}</span>{/if}
    </button>
  {/each}
</div>
{#if selected !== undefined}
  <div id="{id}-panel" role="tabpanel" aria-labelledby="{id}-tab-{selected}" tabindex="0">
    {@render panel(selected)}
  </div>
{/if}

<style>
.tabs {
  display: flex;
  flex-wrap: wrap;
  justify-content: var(--pill-tabs-justify, flex-start);
  gap: var(--toggle-chip-gap);
  margin-block-start: var(--space-sm-block);
}

button {
  display: inline-flex;
  align-items: center;
  gap: var(--toggle-chip-count-gap);
  min-block-size: var(--tab-height);
  padding: 0 var(--tab-padding-inline);
  border: 1px solid var(--color-control-border);
  border-radius: var(--radius-control);
  background-color: var(--color-control-bg);
  color: var(--color-control-text);
  font: inherit;
  font-size: var(--font-size-tab);
  font-weight: var(--font-weight-control);
  line-height: 1;
  white-space: nowrap;
  cursor: pointer;

  &:hover {
    border-color: var(--color-control-border-hover);
    background-color: var(--color-control-hover-bg);
  }

  &[aria-selected='true'] {
    border-color: var(--color-tab-picked-border);
    background-color: var(--color-tab-picked-bg);
    color: var(--color-tab-picked-text);

    &:hover {
      background-color: var(--color-tab-picked-bg-hover);
    }
  }
}

.count {
  padding: var(--toggle-chip-count-padding);
  border-radius: var(--radius-toggle-chip-count);
  background-color: var(--color-toggle-chip-count-bg);
  font-size: var(--font-size-toggle-chip-count);
  font-weight: var(--font-weight-headings-heavy);
  font-variant-numeric: tabular-nums;

  [aria-selected='true'] & {
    background-color: var(--brand-primary);
    color: var(--color-text-inverse);
  }
}

@media (prefers-reduced-motion: no-preference) {
  button {
    transition: background-color var(--transition-season-ribbon), border-color var(--transition-season-ribbon);
  }
}
</style>
