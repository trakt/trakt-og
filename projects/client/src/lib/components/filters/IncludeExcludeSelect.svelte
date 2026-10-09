<!--
  A full-width filter field that keeps and leaves out values, like v3's: each choice has ⊕ (keep it, green) and ⊖
  (leave it out, red, struck through), and clicking the name keeps it. Reset clears the field, long lists get a search,
  and the button reads "Genres: Drama, −Animation". Picking keeps the menu open.
    <IncludeExcludeSelect label="Genres" groups={[{ options }]} selection={{ include, exclude }} onchange={set} />
  Empty, it reads "Genres: Any".
-->
<script lang="ts">
import Dropdown from '$lib/components/dropdown/Dropdown.svelte';
import Icon from '$lib/icons/Icon.svelte';
import searchIcon from '$lib/icons/light/magnifying-glass.svg?raw';
import plusIcon from '$lib/icons/regular/circle-plus.svg?raw';
import minusIcon from '$lib/icons/regular/circle-minus.svg?raw';
import plusSolid from '$lib/icons/solid/circle-plus.svg?raw';
import minusSolid from '$lib/icons/solid/circle-minus.svg?raw';
import type { FilterOptionGroup } from './filterOptions.ts';
import type { ListSelection } from './listSelection.ts';

interface Props {
  /** "Genres": in the button before the picks, and the menu's name. */
  label: string;
  groups: readonly FilterOptionGroup[];
  selection: ListSelection;
  /** Off for watch now, which the API only filters by. */
  excludable?: boolean;
  loading?: boolean;
  disabled?: boolean;
  /** Names a pick the options don't have yet: they load when the panel first opens. */
  labelFor?: (value: string) => string;
  onchange: (selection: ListSelection) => void;
}

const {
  label,
  groups,
  selection,
  excludable = true,
  loading = false,
  disabled = false,
  labelFor = (value: string) => value,
  onchange,
}: Props = $props();

let query = $state('');
const byValue = $derived(new Map(groups.flatMap((group) => group.options).map((option) => [option.value, option])));
const name = (value: string) => byValue.get(value)?.label ?? labelFor(value);
const count = $derived(groups.reduce((sum, group) => sum + group.options.length, 0));
const shown = $derived.by(() => {
  const term = query.trim().toLocaleLowerCase('en');
  if (!term) return groups;
  return groups
    .map((group) => ({
      ...group,
      options: group.options.filter((option) => option.label.toLocaleLowerCase('en').includes(term)),
    }))
    .filter((group) => group.options.length > 0);
});
const picked = $derived(selection.include.length + selection.exclude.length);

function toggle(value: string, as: 'include' | 'exclude') {
  if (disabled) return;
  const without = (values: readonly string[]) => values.filter((other) => other !== value);
  const flip = (values: readonly string[]) => (values.includes(value) ? without(values) : [...values, value]);
  onchange(
    as === 'include'
      ? { include: flip(selection.include), exclude: without(selection.exclude) }
      : { include: without(selection.include), exclude: flip(selection.exclude) },
  );
}
</script>

<Dropdown block multiple section={label}>
  {#snippet trigger()}{#if picked === 0}<span class="placeholder">Any</span>{:else}{#each selection.include as
        value, i (value)}{i > 0 ? ', ' : ''}<span class="kept">{name(value)}</span>{/each}{#each selection.exclude as
        value, i (value)}{selection.include.length + i > 0 ? ', ' : ''}<span class="left-out">−{name(value)}</span
        >{/each}{/if}{/snippet}
  <div class="picker" aria-label={label}>
    <button type="button" class="reset" disabled={disabled || picked === 0}
      onclick={() => onchange({ include: [], exclude: [] })}>Reset</button>
    {#if count > 8}
      <label class="search"><Icon svg={searchIcon} /><input type="search" bind:value={query}
          placeholder="Search {label.toLocaleLowerCase('en')}" aria-label="Search {label.toLocaleLowerCase('en')}" /></label>
    {/if}
    {#if loading && count === 0}
      <p class="note">Loading...</p>
    {:else if shown.length === 0}
      <p class="note">No {label.toLocaleLowerCase('en')} match "{query}"</p>
    {/if}
    {#each shown as group, g (g)}
      {#if group.label}<p class="group">{group.label}</p>{/if}
      <ul class="rows">
        {#each group.options as option (option.value)}
          {@const kept = selection.include.includes(option.value)}
          {@const leftOut = selection.exclude.includes(option.value)}
          <li class={{ kept, 'left-out': leftOut }}>
            <button type="button" class="toggle keep" aria-pressed={kept} aria-label="Keep {option.label}" {disabled}
              onclick={() => toggle(option.value, 'include')}><Icon svg={kept ? plusSolid : plusIcon} /></button>
            <button type="button" class="name" {disabled} onclick={() => toggle(option.value, 'include')}
            >{option.label}{#if option.tag}<span class="tag">{option.tag}</span>{/if}</button>
            {#if excludable}
              <button type="button" class="toggle leave" aria-pressed={leftOut} aria-label="Leave out {option.label}"
                {disabled} onclick={() => toggle(option.value, 'exclude')}><Icon svg={leftOut ? minusSolid : minusIcon} /></button>
            {/if}
          </li>
        {/each}
      </ul>
    {/each}
    {#if excludable}<p class="hint">⊕ shows only these, ⊖ hides them</p>{/if}
  </div>
</Dropdown>

<style>
.placeholder {
  color: var(--color-control-muted);
  font-weight: normal;
}

.kept {
  color: var(--color-filter-include-text);
}

.left-out {
  color: var(--color-filter-exclude-text);
}

.picker {
  display: grid;
  gap: var(--space-xs-block);
  inline-size: var(--filter-picker-width);
  max-block-size: var(--filter-picker-height);
  overflow-y: auto;
}

/* The menu's rows style every button; these pickers keep their own shape and never show the menu's check. */
.picker button::after {
  display: none;
}

.reset {
  justify-content: flex-start;
}

.search {
  display: flex;
  align-items: center;
  gap: var(--space-base-block);
  margin-block-end: var(--space-xs-block);
  padding: 0 var(--space-sm-inline);
  border: 1px solid var(--color-menu-border);
  border-radius: var(--radius-menu-row);
  color: var(--color-control-muted);

  & input {
    flex: 1;
    min-inline-size: 0;
    block-size: var(--control-height-small);
    border: 0;
    background: none;
    box-shadow: none;
    color: var(--color-control-text);
    font: inherit;

    &:focus-visible {
      outline: 0;
    }
  }

  &:focus-within {
    border-color: var(--color-input-border-focus);
  }
}

.note,
.group,
.hint {
  margin: 0;
  padding: var(--space-base-block) var(--space-sm-inline);
  color: var(--color-menu-header);
  font-size: var(--font-size-small);
}

.group {
  font-size: var(--font-size-menu-header);
  font-weight: var(--font-weight-menu-header);
  letter-spacing: var(--letter-spacing-menu-header);
  text-transform: uppercase;
}

.rows {
  margin: 0;
  padding: 0;
  list-style: none;
}

li {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: var(--space-xs-block);
  border-radius: var(--radius-menu-row);

  &:hover {
    background-color: var(--color-menu-row-hover);
  }
}

.picker .toggle {
  display: grid;
  place-items: center;
  inline-size: var(--filter-toggle-size);
  block-size: var(--filter-toggle-size);
  padding: 0;
  border-radius: var(--radius-menu-row);
  color: var(--color-filter-toggle-idle);

  &:is(:hover, :focus-visible) {
    background-color: var(--color-control-raised-hover-bg);
    color: var(--color-menu-row-hover-text);
  }
}

.picker .name {
  justify-content: flex-start;
  padding-inline: var(--space-xs-inline);
  overflow: hidden;
  text-overflow: ellipsis;

  &:is(:hover, :focus-visible) {
    background: none;
  }
}

.picker .rows .kept .keep {
  background-color: var(--color-filter-include);
  color: var(--color-text-inverse);
}

.kept .name {
  color: var(--color-filter-include-text);
  font-weight: var(--font-weight-headings-heavy);
}

.picker .rows .left-out .leave {
  background-color: var(--color-filter-exclude);
  color: var(--color-text-inverse);
}

.left-out .name {
  color: var(--color-filter-exclude-text);
  text-decoration: line-through;
}

.tag {
  margin-inline-start: auto;
  padding: 1px 4px;
  border-radius: var(--radius-sm);
  background-color: var(--color-filter-option-tag-bg);
  color: var(--color-filter-option-tag);
  font-size: var(--font-size-small);
}
</style>
