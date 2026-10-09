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
import heart from '$lib/icons/regular/heart.svg?raw';
import xmark from '$lib/icons/regular/xmark.svg?raw';
import plusIcon from '$lib/icons/regular/circle-plus.svg?raw';
import minusIcon from '$lib/icons/regular/circle-minus.svg?raw';
import plusSolid from '$lib/icons/solid/circle-plus.svg?raw';
import minusSolid from '$lib/icons/solid/circle-minus.svg?raw';
import type { FilterOptionGroup } from './filterOptions.ts';
import type { ListSelection } from './listSelection.ts';
import SearchField from './SearchField.svelte';

/** A service's logo tile before its name; `heart` is All Favorites. */
type OptionTile = { readonly logo?: string; readonly color?: string; readonly heart?: boolean };

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
  /** The streaming field's logo tiles. */
  tileFor?: (value: string) => OptionTile | undefined;
  searchPlaceholder?: string;
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
  tileFor,
  searchPlaceholder,
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

<div class={['field', { filled: picked > 0 }]}>
  <Dropdown block multiple section={label}>
  {#snippet trigger()}{#if picked === 0}<span class="placeholder">Any</span>{:else}{#each selection.include as
        value, i (value)}{i > 0 ? ', ' : ''}<span class="kept">{name(value)}</span>{/each}{#each selection.exclude as
        value, i (value)}{selection.include.length + i > 0 ? ', ' : ''}<span class="left-out">{name(value)}</span
        >{/each}{/if}{/snippet}
  <div class="picker" aria-label={label}>
    <div class="head">
      <p class="title">{label}</p>
      <button type="button" class="clear" disabled={disabled || picked === 0}
        onclick={() => onchange({ include: [], exclude: [] })}><Icon svg={xmark} />Clear</button>
    </div>
    {#if count > 8}
      <SearchField bind:value={query} label="Search {label.toLocaleLowerCase('en')}"
        placeholder={searchPlaceholder ?? `Search ${label.toLocaleLowerCase('en')}…`} />
    {/if}
    <div class="scroller">
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
          {@const tile = tileFor?.(option.value)}
          <li class={{ kept, 'left-out': leftOut }}>
            <button type="button" class="toggle keep" aria-pressed={kept} aria-label="Keep {option.label}" {disabled}
              onclick={() => toggle(option.value, 'include')}><Icon svg={kept ? plusSolid : plusIcon} /></button>
            <button type="button" class="name" {disabled} onclick={() => toggle(option.value, 'include')}
            >{#if tile}<span class={['tile', { heart: tile.heart }]} style:--service-color={tile.color}
                >{#if tile.heart}<Icon svg={heart} />{:else if tile.logo}<img src={tile.logo} alt="" />{:else}{option
                    .label.charAt(0)}{/if}</span>{/if}<span class="label">{option.label}</span>{#if option.tag}<span
                  class="tag">{option.tag}</span>{/if}</button>
            {#if excludable}
              <button type="button" class="toggle leave" aria-pressed={leftOut} aria-label="Leave out {option.label}"
                {disabled} onclick={() => toggle(option.value, 'exclude')}><Icon svg={leftOut ? minusSolid : minusIcon} /></button>
            {/if}
          </li>
        {/each}
      </ul>
    {/each}
    </div>
    {#if excludable}<p class="hint">⊕ shows only these, ⊖ hides them</p>{/if}
  </div>
  </Dropdown>
</div>

<style>
/* "Any" reads as the value it is. A field with picks takes the red "filter on" look of the chips and the funnel:
   kept values in white, left-out ones struck through. */
.placeholder {
  color: var(--color-control-text);
}

.field.filled :global(.trigger) {
  border-color: var(--color-sidebar-pill-set-border);
  background-color: var(--color-sidebar-pill-set-bg);

  & :global(.section) {
    color: var(--color-sidebar-pill-set-text);
  }
}

.kept {
  color: var(--color-control-text);
}

.left-out {
  color: var(--color-sidebar-pill-set-text);
  text-decoration: line-through;
}

.picker {
  display: grid;
  gap: var(--space-base-block);
  inline-size: var(--filter-picker-width);
}

/* The field's name with Clear across from it, like the filter popovers' heading and footer. */
.head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-inline-start: var(--space-xs-inline);
}

.title {
  margin: 0;
  color: var(--color-menu-header);
  font-size: var(--font-size-menu-header);
  font-weight: var(--font-weight-menu-header);
  letter-spacing: var(--letter-spacing-menu-header);
  text-transform: uppercase;
}

.picker .head .clear {
  display: inline-flex;
  align-items: center;
  gap: var(--space-control-caret);
  inline-size: auto;
  min-block-size: var(--control-height-small);
  padding: 0 var(--space-sm-inline);
  border: 1px solid var(--color-control-border);
  border-radius: var(--radius-control);
  background-color: var(--color-control-raised-bg);
  color: var(--color-control-text);
  font-size: var(--font-size-small);

  &::after {
    display: none;
  }

  & :global(.icon) {
    font-size: var(--font-size-tool-icon-small);
  }

  &:is(:hover, :focus-visible):not(:disabled) {
    border-color: var(--brand-primary);
    background-color: var(--color-control-raised-hover-bg);
    color: var(--brand-primary);
  }

  &:disabled {
    cursor: default;
    opacity: var(--opacity-action-disabled);
  }
}

/* Only the list scrolls, with room kept for its scrollbar so it never covers the ⊖ column. */
.scroller {
  max-block-size: var(--filter-picker-height);
  overflow-y: auto;
  scrollbar-gutter: stable;
  scrollbar-width: thin;
}

.picker .rows li button::after {
  display: none;
}

.picker .rows li button {
  font-weight: normal;
}

/* The watch-now filter's logo tile. */
.tile {
  display: inline-grid;
  flex: none;
  place-items: center;
  inline-size: var(--service-mini-width);
  block-size: var(--service-mini-height);
  margin-inline-end: var(--space-sm-inline);
  padding: var(--service-mini-padding);
  border: 1px solid var(--color-menu-border);
  border-radius: var(--radius-service-mini);
  background-color: var(--service-color, var(--color-control-bg));
  color: var(--color-text-inverse);
  font-weight: var(--font-weight-headings-heavy);

  & img {
    inline-size: 100%;
    block-size: 100%;
    object-fit: contain;
  }

  &.heart {
    background-color: var(--color-control-bg);
    color: var(--brand-primary);
  }
}

.label {
  overflow: hidden;
  text-overflow: ellipsis;
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

.picker .rows li .toggle {
  display: grid;
  place-content: center;
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

.picker .rows .kept .name {
  color: var(--color-filter-include-text);
  font-weight: var(--font-weight-headings-heavy);
}

.picker .rows .left-out .leave {
  background-color: var(--color-filter-exclude);
  color: var(--color-text-inverse);
}

.picker .rows .left-out .name {
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
