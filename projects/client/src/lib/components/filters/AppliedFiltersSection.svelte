<!--
  A SidebarFrame sidebar's Applied Filters: a folding section of removable chips, its title counting them so a folded
  one still says how many are on, with Clear on the right as a reset icon that fills on hover. Its open state shares
  the `sidebar_filters` cookie on every page. With `onsave`, a Save button before Clear keeps the filters as a smart
  list, where classic Trakt had Save Filters, or with `saveAs="filters"` as a calendar's saved filter; `children` goes
  over the chips (the open smart list), and `tools` sits beside Clear (its delete). A `ManageConfirm` named `delete` there gets Clear's look.
    <AppliedFiltersSection {chips} open={data.sidebar.filters} clearHref={page.url.pathname} onremove={remove} />
-->
<script lang="ts">
import type { Snippet } from 'svelte';
import SidebarSection from '$lib/components/sidebar/SidebarSection.svelte';
import Tooltip from '$lib/components/tooltip/Tooltip.svelte';
import Icon from '$lib/icons/Icon.svelte';
import resetIcon from '$lib/icons/regular/arrow-rotate-left.svg?raw';
import { countLabel } from '$lib/utils/countLabel';
import FilterChips from './FilterChips.svelte';
import type { FilterTag } from './filterTags.ts';
import { SAVE_TARGETS, type SaveTarget } from './saveTargets.ts';
import { trackFiltersReset } from './trackFiltersReset.ts';

interface Props {
  chips: readonly FilterTag[];
  open: boolean;
  /** The page without any filters. */
  clearHref: string;
  onremove: (id: string) => void;
  onsave?: () => void;
  saveAs?: SaveTarget;
  children?: Snippet;
  /** Icons before Clear. */
  tools?: Snippet;
}

const { chips, open, clearHref, onremove, onsave, saveAs = 'smart-list', children, tools }: Props = $props();
const save = $derived(SAVE_TARGETS[saveAs]);
</script>

<!-- The page builds the href from its own path, so resolve() has nothing to add. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->

<SidebarSection id="filters" title={countLabel(chips.length, 'Applied Filter')} {open} remember>
  {#snippet action()}
    <span class="actions">
      {#if onsave}
        <Tooltip text={save.label}>
          {#snippet trigger(tooltip)}
            <button type="button" class="save" onclick={onsave} {...tooltip}><Icon svg={save.svg} />Save</button>
          {/snippet}
        </Tooltip>
      {/if}
      <span class="tools">
        {@render tools?.()}
        {#if chips.length > 0}
          <Tooltip text="Clear filters">
            {#snippet trigger(tooltip)}
              <a class="clear" href={clearHref} aria-label="Clear filters" onclick={trackFiltersReset} {...tooltip}><Icon svg={resetIcon} /></a>
            {/snippet}
          </Tooltip>
        {/if}
      </span>
    </span>
  {/snippet}
  {@render children?.()}
  {#if chips.length > 0}<FilterChips {chips} {onremove} />{/if}
</SidebarSection>

<style>
.actions {
  display: inline-flex;
  align-items: center;
  gap: var(--space-base-block);
}

/* Clear and the page's icons, close together like a comment's tools. */
.tools {
  display: inline-flex;
  align-items: center;
  gap: var(--comment-tools-gap);

  &:empty {
    display: none;
  }
}

/*
  Save's height, with no fill until hover, like the list page's icons. Separate selectors, not one list, so the delete
  keeps the specificity that beats ManageConfirm's own reset.
*/
.clear,
.tools :global(.confirm.delete > button) {
  display: inline-grid;
  place-items: center;
  inline-size: var(--control-height-mini);
  block-size: var(--control-height-mini);
  border-radius: var(--radius-comment-tool);
  color: var(--color-control-muted);
  font-size: var(--font-size-small);
  cursor: pointer;
  transition: background-color var(--transition-comment-quiet), color var(--transition-comment-quiet);
}

.clear:is(:hover, :focus-visible) {
  background-color: var(--color-comment-chip);
  color: var(--color-control-text);
}

/* The delete stays a list row's red. */
.tools :global(.confirm.delete > button) {
  color: var(--color-list-delete);
}

.tools :global(.confirm.delete > button:is(:hover, :focus-visible, [aria-expanded='true'])) {
  background-color: var(--color-comment-chip);
}

/* A list's Done: green tint, green outline. */
.save {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs-inline);
  min-block-size: var(--control-height-mini);
  padding: 0 var(--space-base-block);
  border: 1px solid var(--color-mode-done-border);
  border-radius: var(--radius-control);
  background-color: var(--color-mode-done-bg);
  color: var(--color-mode-done-text);
  font-family: var(--font-headings);
  font-size: var(--font-size-small);
  font-weight: var(--font-weight-headings-heavy);
  cursor: pointer;
  transition: background-color 0.2s, border-color 0.2s;

  & :global(.icon) {
    color: inherit;
  }

  &:is(:hover, :focus-visible) {
    border-color: var(--color-mode-done-border);
    background-color: var(--color-mode-done-bg-hover);
  }
}
</style>
