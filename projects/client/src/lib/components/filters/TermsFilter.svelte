<!--
  OG's title filter: a search icon, red while a term is applied, that opens a small panel to find items by title.
  Apply (or Enter) filters to the term, and the × drops it. `t` opens it too.
    <TermsFilter bind:terms />
-->
<script lang="ts">
import FilterPopover from '$lib/components/filters/FilterPopover.svelte';
import Tooltip from '$lib/components/tooltip/Tooltip.svelte';
import Icon from '$lib/icons/Icon.svelte';
import search from '$lib/icons/regular/magnifying-glass.svg?raw';

interface Props {
  terms: string;
  /** What the term matches, under the panel's title. */
  help?: string;
  /** Turns off the `t` shortcut, for while the page around it is inert. */
  disabled?: boolean;
}

let {
  terms = $bindable(),
  help = 'Only display items with a title matching your search term.',
  disabled = false,
}: Props = $props();
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
  if (event.key !== 't' || event.metaKey || event.ctrlKey || event.altKey || disabled) return;
  if (event.target instanceof HTMLElement && event.target.closest('input, textarea, select, [contenteditable]')) {
    return;
  }
  event.preventDefault();
  popover?.show();
}
</script>

<svelte:window {onkeydown} />

<FilterPopover bind:this={popover} svg={search} label="Filter by title" tooltip="Filter by Title" title="Search terms"
  {help} active={Boolean(terms)}
  clearable={Boolean(terms)} onopen={() => (draft = terms)} onapply={apply} onclear={clear}>
  <label class="panel-field">
    <Icon svg={search} />
    <input type="search" aria-label="Search term" placeholder="Type a search term…" autocomplete="off"
      bind:value={draft} />
    <Tooltip text="Press T to open this from anywhere on the page">
      {#snippet trigger(tooltip)}<kbd {...tooltip}>T</kbd>{/snippet}
    </Tooltip>
  </label>
</FilterPopover>
