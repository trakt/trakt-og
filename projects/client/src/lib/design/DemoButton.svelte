<!--
  A demo's own action, like "Open the report dialog", in og's button look: the same height, corners and type as
  LinkButton. `primary` is the red one; the rest are outlined. Extra attributes (a tooltip's) land on the button.
-->
<script lang="ts">
import type { Snippet } from 'svelte';
import type { HTMLButtonAttributes } from 'svelte/elements';

interface Props extends HTMLButtonAttributes {
  variant?: 'primary' | 'outline';
  children: Snippet;
}

const { variant = 'outline', children, ...rest }: Props = $props();
</script>

<button type="button" class={['demo-button', variant]} {...rest}>{@render children()}</button>

<style>
.demo-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  justify-self: start;
  gap: var(--link-button-gap);
  min-block-size: var(--control-height);
  padding: 0 var(--link-button-inline);
  border: 0;
  border-radius: var(--radius-object);
  font-family: var(--font-headings);
  font-weight: var(--font-weight-headings);
  white-space: nowrap;
  cursor: pointer;
  transition: background-color var(--link-button-duration), box-shadow var(--link-button-duration);
}

.primary {
  background-color: var(--brand-primary);
  box-shadow: inset 0 0 0 1px var(--color-btn-primary-border);
  color: var(--color-text-inverse);

  &:is(:hover, :focus-visible) {
    background-color: var(--brand-primary-darken);
  }
}

.outline {
  background: none;
  box-shadow: inset 0 0 0 1px var(--color-link-button-line);
  color: inherit;

  &:is(:hover, :focus-visible) {
    background-color: var(--color-link-button-hover);
  }
}
</style>
