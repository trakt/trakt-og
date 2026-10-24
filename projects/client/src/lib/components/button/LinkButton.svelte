<!--
  A link to another site that looks like og's standard button, opening in a new tab with an arrow after the label:
  `primary` is the red one, `outline` a light outline for a second action on a dark panel, and `violet` the current
  Trakt brand violet, for links to Trakt's own services.
    <LinkButton href={newBugUrl}>Open a bug report</LinkButton>
    <LinkButton href={docsUrl} variant="violet">Developer portal</LinkButton>
-->
<script lang="ts">
import Icon from '$lib/icons/Icon.svelte';
import external from '$lib/icons/light/arrow-up-right-from-square.svg?raw';
import type { Snippet } from 'svelte';

interface Props {
  href: string;
  variant?: 'primary' | 'outline' | 'violet';
  children: Snippet;
}

const { href, variant = 'primary', children }: Props = $props();
</script>

<!-- Other sites' URLs, which resolve() can't type. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->

<a
  class={['link-button', variant]}
  {href}
  target="_blank"
  rel="noopener"
>
  {@render children()}
  <Icon svg={external} />
</a>

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
