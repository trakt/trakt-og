<!--
  A search box with its magnifier inside, like the filter popovers' fields: the icon tucked in at the start, the
  control's fill and border, and an optional shortcut key cap at the end.
    <SearchField label="Search genres" placeholder="Search genres" bind:value={query} />
-->
<script lang="ts">
import Icon from '$lib/icons/Icon.svelte';
import search from '$lib/icons/regular/magnifying-glass.svg?raw';

interface Props {
  value: string;
  label: string;
  placeholder: string;
  disabled?: boolean;
  /** A key that focuses it, shown at the end. */
  kbd?: string;
  oninput?: (value: string) => void;
}

let { value = $bindable(), label, placeholder, disabled = false, kbd, oninput }: Props = $props();
</script>

<label class="search-field">
  <Icon svg={search} />
  <input type="search" aria-label={label} {placeholder} {disabled} autocomplete="off" bind:value
    oninput={() => oninput?.(value)} />
  {#if kbd}<kbd>{kbd}</kbd>{/if}
</label>

<style>
.search-field {
  position: relative;
  display: block;

  & > :global(.icon) {
    position: absolute;
    inset-block-start: 50%;
    inset-inline-start: var(--space-control-inline);
    translate: 0 -50%;
    color: var(--color-control-muted);
    font-size: var(--font-size-tool-icon-small);
    pointer-events: none;
  }
}

input {
  inline-size: 100%;
  block-size: var(--control-height);
  padding: 0 var(--space-control-inline) 0 var(--space-filter-popover-field-icon);
  border: 1px solid var(--color-control-border);
  border-radius: var(--radius-control);
  background-color: var(--color-control-bg);
  box-shadow: none;
  color: var(--color-control-text);
  font: inherit;
  font-size: var(--font-size-control);

  &::placeholder {
    color: var(--color-input-placeholder);
  }

  &:focus-visible {
    border-color: var(--color-control-border-hover);
    outline: none;
  }
}

kbd {
  position: absolute;
  inset-block: 0;
  inset-inline-end: var(--space-stat);
  display: inline-grid;
  place-items: center;
  min-inline-size: var(--search-kbd-size);
  block-size: var(--search-kbd-size);
  margin-block: auto;
  padding-inline: var(--space-xs-inline);
  border-radius: var(--radius-search-kbd);
  background: var(--color-search-kbd-bg);
  color: var(--color-control-muted);
  font-family: inherit;
  font-size: var(--font-size-small);
  font-weight: var(--font-weight-headings);
  line-height: 1;
  pointer-events: none;
}
</style>
