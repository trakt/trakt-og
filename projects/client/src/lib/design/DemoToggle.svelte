<!-- Turns one demo setting on or off, like "Display name set": a pill that fills red while on. -->
<script lang="ts">
import Icon from '$lib/icons/Icon.svelte';
import check from '$lib/icons/trakt/check-thick.svg?raw';
import type { Snippet } from 'svelte';

interface Props {
  checked: boolean;
  children: Snippet;
}

let { checked = $bindable(), children }: Props = $props();
</script>

<button type="button" class="demo-toggle" aria-pressed={checked} onclick={() => (checked = !checked)}>
  <span class="box">{#if checked}<Icon svg={check} />{/if}</span>{@render children()}
</button>

<style>
.demo-toggle {
  display: inline-flex;
  align-items: center;
  gap: var(--space-sm-inline);
  min-block-size: auto;
  padding: var(--space-xs-block) var(--space-base-inline) var(--space-xs-block) var(--space-sm-block);
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

  &[aria-pressed='true'] .box {
    background-color: var(--brand-primary);
    box-shadow: none;
    color: var(--color-text-inverse);
  }
}

.box {
  display: inline-grid;
  place-items: center;
  inline-size: 1.4em;
  block-size: 1.4em;
  border-radius: 50%;
  box-shadow: inset 0 0 0 1px var(--color-link-button-line);
  font-size: var(--font-size-small);
  line-height: 1;
}
</style>
