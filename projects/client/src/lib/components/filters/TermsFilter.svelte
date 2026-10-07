<!--
  OG's title filter: a search icon, red while a term is applied, that opens a small panel to find items by title.
  Apply (or Enter) filters to the term, and the × drops it. `t` opens it too. It was a VIP feature, so everyone
  else gets a link to the VIP filtering page instead.
    <TermsFilter bind:terms vip={user?.isVip ?? false} />
-->
<script lang="ts">
import Caret from '$lib/components/dropdown/Caret.svelte';
import FilterPopover from '$lib/components/filters/FilterPopover.svelte';
import Tooltip from '$lib/components/tooltip/Tooltip.svelte';
import Icon from '$lib/icons/Icon.svelte';
import search from '$lib/icons/regular/magnifying-glass.svg?raw';
import { traktUrls } from '$lib/traktUrls';

interface Props {
  terms: string;
  vip: boolean;
}

let { terms = $bindable(), vip }: Props = $props();
let draft = $state('');
let popover = $state<ReturnType<typeof FilterPopover>>();

function apply() {
  terms = draft.trim();
}

function clear() {
  terms = '';
  draft = '';
}

function onkeydown(event: KeyboardEvent) {
  if (event.key !== 't' || event.metaKey || event.ctrlKey || event.altKey || !vip) return;
  if (event.target instanceof HTMLElement && event.target.closest('input, textarea, select, [contenteditable]')) {
    return;
  }
  event.preventDefault();
  popover?.show();
}
</script>

<svelte:window {onkeydown} />

<!-- The VIP page is an OG route og hasn't built yet, and resolve() only takes routes that exist. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->

{#if vip}
  <FilterPopover bind:this={popover} svg={search} label="Filter by title" tooltip="Filter by Title" title="Search terms"
  help="Only display items with a title matching your search term." active={Boolean(terms)}
  clearable={Boolean(terms)} onopen={() => (draft = terms)} onapply={apply} onclear={clear}>
  <label class="panel-field">
    <Icon svg={search} />
    <input type="search" aria-label="Search term" placeholder="Type a search term…" autocomplete="off"
      bind:value={draft} />
    <kbd title="Press T to open this from anywhere on the page">T</kbd>
  </label>
</FilterPopover>
{:else}
  <Tooltip text="Filter by Title">
    {#snippet trigger(tooltip)}
      <a class="launcher" href={traktUrls.vip} target="_blank" rel="noopener" aria-label="Filter by title" {...tooltip}>
        <Icon svg={search} /><Caret />
      </a>
    {/snippet}
  </Tooltip>
{/if}

<style>
.launcher {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-tool-caret);
  min-inline-size: var(--tool-size);
  min-block-size: var(--tool-size);
  padding: 0 var(--space-tool-inline);
  border-radius: var(--radius-control);
  color: var(--color-tool);
  font-size: var(--font-size-tool);
  line-height: 1;
  text-decoration: none;
  vertical-align: middle;
  transition: color 0.5s, background-color 0.2s;

  &:is(:hover, :focus-visible) {
    background-color: var(--color-tool-hover-bg);
    color: var(--color-tool-hover);
    --caret-color: currentcolor;
  }
}
</style>
