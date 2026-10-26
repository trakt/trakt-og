<!--
  og's standard button: `primary` is the red one, `outline` a light outline for a second action or a quiet one, and
  `violet` the current Trakt brand violet, for links to Trakt's own services. With an `href` it's a link: another
  site's opens in a new tab with an arrow after the label, og's own stays in the tab. With `onclick` and no `href`
  it's a button.
    <LinkButton href={newBugUrl}>Open a bug report</LinkButton>
    <LinkButton onclick={clear} variant="outline">Clear filters</LinkButton>
-->
<script lang="ts">
import Icon from '$lib/icons/Icon.svelte';
import external from '$lib/icons/light/arrow-up-right-from-square.svg?raw';
import type { Snippet } from 'svelte';

interface Props {
  href?: string;
  onclick?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'outline' | 'violet';
  children: Snippet;
}

const { href, onclick, disabled = false, variant = 'primary', children }: Props = $props();
const offsite = $derived(!!href && /^https?:\/\//.test(href));
</script>

<!-- Callers pass resolved routes or other sites' URLs, which resolve() can't type. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->

{#if href}
  <a
    class={['link-button', variant]}
    {href}
    target={offsite ? '_blank' : undefined}
    rel={offsite ? 'noopener' : undefined}
  >
    {@render children()}
    {#if offsite}<Icon svg={external} />{/if}
  </a>
{:else}
  <button type="button" class={['link-button', variant]} {onclick} {disabled}>{@render children()}</button>
{/if}

<style>
.link-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--link-button-gap);
  min-block-size: var(--control-height);
  padding-inline: var(--link-button-inline);
  border-radius: var(--radius-object);
  font-family: var(--font-headings);
  font-weight: var(--font-weight-headings);
  white-space: nowrap;
  text-decoration: none;
  transition: background-color var(--link-button-duration), box-shadow var(--link-button-duration);

  /* At class weight, so the variants below still set a button's border and fill. */
  &:where(button) {
    padding-block: 0;
    border: 0;
    background: none;
    font-size: inherit;
    line-height: inherit;
  }

  &:disabled {
    opacity: 0.65;
    cursor: progress;
  }

  &:is(:hover, :focus-visible) {
    text-decoration: none;
  }
}

.violet {
  border: 1px solid var(--brand-violet);
  background-color: var(--brand-violet);
  color: var(--color-text-inverse);

  &:is(:hover, :focus-visible) {
    border-color: var(--brand-violet-darken);
    background-color: var(--brand-violet-darken);
    color: var(--color-text-inverse);
  }
}

.primary {
  border: 1px solid var(--color-btn-primary-border);
  background-color: var(--brand-primary);
  color: var(--color-text-inverse);

  &:is(:hover, :focus-visible) {
    background-color: var(--brand-primary-darken);
    color: var(--color-text-inverse);
  }
}

.outline {
  box-shadow: inset 0 0 0 1px var(--color-link-button-line);
  color: inherit;

  &:is(:hover, :focus-visible) {
    background-color: var(--color-link-button-hover);
    color: inherit;
  }
}
</style>
