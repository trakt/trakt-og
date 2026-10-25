<!--
  Picks one of a demo's options, like which viewer or backdrop to show: a labeled row of pills, the picked one red.
  It's a radio group for assistive tech, so arrow keys aren't needed: each pill is its own button.
-->
<script lang="ts" generics="Value extends string">
interface Props {
  label: string;
  options: readonly { value: Value; label: string }[];
  value: Value;
}

let { label, options, value = $bindable() }: Props = $props();
</script>

<div class="demo-choice" role="radiogroup" aria-label={label}>
  <span class="label" aria-hidden="true">{label}</span>
  {#each options as option (option.value)}
    <button type="button" role="radio" aria-checked={option.value === value} onclick={() => (value = option.value)}>
      {option.label}
    </button>
  {/each}
</div>

<style>
.demo-choice {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-sm-inline);
}

.label {
  margin-inline-end: var(--space-xs-inline);
  color: var(--color-design-caption);
  font-family: var(--font-headings);
  font-size: var(--font-size-design-caption);
  font-weight: var(--font-weight-headings);
  letter-spacing: var(--letter-spacing-design-eyebrow);
  text-transform: uppercase;
}

button {
  min-block-size: auto;
  padding: var(--space-xs-block) var(--space-base-inline);
  border: 0;
  border-radius: var(--radius-round);
  background: none;
  box-shadow: inset 0 0 0 1px var(--color-link-button-line);
  color: inherit;
  font-family: var(--font-headings);
  font-size: var(--font-size-small);
  font-weight: var(--font-weight-headings);
  cursor: pointer;

  &:hover {
    background-color: var(--color-link-button-hover);
  }

  &[aria-checked='true'] {
    background-color: var(--brand-primary);
    box-shadow: none;
    color: var(--color-text-inverse);
  }
}
</style>
