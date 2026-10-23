<!--
  The first night's call to action, in the home hero's button style: solid red, or an outline over art. A link by
  default; with `onclick` and no `href` it's a button. External links open in a new tab.
-->
<script lang="ts">
import type { Snippet } from 'svelte';

interface Props {
  href?: string;
  onclick?: () => void;
  outline?: boolean;
  external?: boolean;
  /** A size down, for a toolbar. */
  small?: boolean;
  children: Snippet;
}

const { href, onclick, outline = false, external = false, small = false, children }: Props = $props();
</script>

{#if href}
  <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- callers pass resolved or external hrefs -->
  <a class={['cta', { outline, small }]} {href} {onclick} target={external ? '_blank' : undefined}
  rel={external ? 'noopener' : undefined}>{@render children()}</a>
{:else}
  <button type="button" class={['cta', { outline, small }]} {onclick}>{@render children()}</button>
{/if}

<style>
.cta {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  block-size: var(--first-night-button-height);
  padding-inline: var(--first-night-button-inline);
  border: 0;
  border-radius: var(--radius-object);
  background: var(--brand-primary);
  color: var(--color-first-night-text);
  font: inherit;
  font-size: var(--font-size-first-night-button);
  font-weight: var(--font-weight-headings-heavy);
  text-decoration: none;
  white-space: nowrap;
  cursor: pointer;
  transition: background-color 0.2s, box-shadow 0.2s;

  &:is(:hover, :focus-visible) {
    background: var(--brand-primary-darken);
    color: var(--color-first-night-text);
    text-decoration: none;
  }

  &.small {
    block-size: var(--first-night-button-small-height);
    padding-inline: var(--first-night-button-small-inline);
  }

  &.outline {
    background: transparent;
    box-shadow: inset 0 0 0 1px var(--color-first-night-button-line);

    &:is(:hover, :focus-visible) {
      background: var(--color-first-night-button-hover);
    }
  }
}
</style>
