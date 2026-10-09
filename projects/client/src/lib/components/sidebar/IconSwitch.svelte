<!--
  A sidebar's one-of-a-few switch: segments with an icon and a label, the picked one raised. The calendar picks its
  view with it.
    <IconSwitch label="View" value="list" options={[{ value: 'list', label: 'List', icon: grid }]} onchange={pick} />
-->
<script lang="ts" generics="Value extends string">
import Icon from '$lib/icons/Icon.svelte';

interface Props {
  label: string;
  value: Value;
  options: readonly { readonly value: Value; readonly label: string; readonly icon: string }[];
  onchange: (value: Value) => void;
}

const { label, value, options, onchange }: Props = $props();
</script>

<div class="icon-switch" role="group" aria-label={label}>
  {#each options as option (option.value)}
    <button type="button" aria-pressed={option.value === value} onclick={() => onchange(option.value)}>
      <Icon svg={option.icon} />{option.label}
    </button>
  {/each}
</div>

<style>
.icon-switch {
  display: flex;
  gap: 2px;
  padding: 2px;
  border: 1px solid var(--color-control-border);
  border-radius: var(--radius-control);
  background-color: var(--color-control-bg);
}

button {
  display: inline-flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  gap: var(--space-base-block);
  min-block-size: calc(var(--control-height) - 6px);
  padding: 0 var(--space-sm-inline);
  border: 0;
  border-radius: calc(var(--radius-control) - 2px);
  background: none;
  color: var(--color-sidebar-pill-text);
  font: inherit;
  font-size: var(--font-size-control);
  font-weight: var(--font-weight-control);
  cursor: pointer;

  &:is(:hover, :focus-visible) {
    background-color: var(--color-control-hover-bg);
    color: var(--color-control-text);
  }

  &[aria-pressed='true'] {
    background-color: var(--color-control-raised-bg);
    color: var(--color-control-text);
  }
}
</style>
