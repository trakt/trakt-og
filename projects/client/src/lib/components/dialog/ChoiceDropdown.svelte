<!--
  One choice from a few, as a labelled full-width dropdown: a list's privacy, comments on or off. Its trigger shows the
  picked option's icon and label, or a muted `placeholder` before anything's picked (a report's reason); the menu marks
  it in red with a check, like every og dropdown. `aside` sits at the label's far end.
    <ChoiceDropdown label="Comments" options={[{ value: true, label: 'Allow' }, { value: false, label: 'Off' }]} bind:value />
-->
<script lang="ts" generics="T extends string | boolean">
import type { Snippet } from 'svelte';
import Dropdown from '$lib/components/dropdown/Dropdown.svelte';
import Icon from '$lib/icons/Icon.svelte';
import FieldLabel from './FieldLabel.svelte';

interface Props {
  label: string;
  options: readonly { value: T; label: string; svg?: string }[];
  value: T;
  disabled?: boolean;
  /** Shown muted in the trigger while `value` matches no option. */
  placeholder?: string;
  /** At the label's far end: the privacy's share link. */
  aside?: Snippet;
}

let { label, options, value = $bindable(), disabled = false, placeholder, aside }: Props = $props();
const id = $props.id();
const picked = $derived(options.find((option) => option.value === value));
</script>

<div class="choice-dropdown" role="group" aria-labelledby="{id}-label" inert={disabled}>
  <FieldLabel text={label} id="{id}-label" {aside} />
  <Dropdown block>
    {#snippet trigger()}
      {#if picked}
        <span class="option">{#if picked.svg}<Icon svg={picked.svg} />{/if}{picked.label}</span>
      {:else}
        <span class="placeholder">{placeholder}</span>
      {/if}
    {/snippet}
    <ul>
      {#each options as option (String(option.value))}
        <li><button type="button" aria-current={option.value === value ? 'true' : undefined} onclick={() => (value = option.value)}
          ><span class="option">{#if option.svg}<Icon svg={option.svg} />{/if}{option.label}</span></button></li>
      {/each}
    </ul>
  </Dropdown>
</div>

<style>
.choice-dropdown {
  min-inline-size: 0;
}

.placeholder {
  color: var(--color-dialog-art-placeholder);
  font-weight: normal;
}

/* The menu row spreads its children apart for the check, so the icon and label travel together. */
.option {
  display: inline-flex;
  align-items: center;
  gap: var(--toggle-chip-count-gap);
  min-inline-size: 0;

  & :global(.icon) {
    flex: none;
    color: var(--color-dialog-art-label);
    font-size: var(--font-size-dialog-art-chip-icon);
  }
}
</style>
