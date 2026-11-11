<!--
  og's standard button: `primary` is the red one, `outline` a light outline for a second action or a quiet one, and
  `developer` the developer site's blueprint blue, for links to the Trakt API. `tinted` is a soft fill and edge in
  `--link-button-tint` (the text color unless set), at regular weight, for quiet ways out on a colored ground like the
  error pages. With an `href` it's a link: another site's opens in a new tab with an arrow after the label, unless
  `arrow={false}` (a label that leads with its own icon), and og's own stays in the tab. With `onclick` and no `href`
  it's a button. `pressed` makes that button a toggle with a box before its label: an empty box in muted gray
  while off, a filled, checked box and a soft red tint while on, so a toggle that's on doesn't pull the eye like a
  primary button.
    <LinkButton href={newBugUrl}>Report a bug</LinkButton>
    <LinkButton onclick={clear} variant="outline">Clear filters</LinkButton>
    <LinkButton onclick={toggle} variant="outline" pressed={night}>Night shading</LinkButton>
-->
<script lang="ts">
import Icon from '#lib/icons/Icon.svelte';
import external from '#lib/icons/light/arrow-up-right-from-square.svg?raw';
import square from '#lib/icons/regular/square.svg?raw';
import squareCheck from '#lib/icons/solid/square-check.svg?raw';
import type { Snippet } from 'svelte';

interface Props {
  href?: string;
  onclick?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'outline' | 'developer' | 'tinted';
  arrow?: boolean;
  /** On or off, for a button that toggles something. */
  pressed?: boolean;
  children: Snippet;
}

const { href, onclick, disabled = false, variant = 'primary', arrow = true, pressed, children }: Props = $props();
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
    {#if offsite && arrow}<Icon svg={external} />{/if}
  </a>
{:else}
  <button type="button" class={['link-button', variant]} aria-pressed={pressed} {onclick} {disabled}>
    {#if pressed !== undefined}<Icon svg={pressed ? squareCheck : square} />{/if}
    {@render children()}
  </button>
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

.developer {
  border: 1px solid var(--brand-developer);
  background-color: var(--brand-developer);
  color: var(--color-text-inverse);

  &:is(:hover, :focus-visible) {
    border-color: var(--brand-developer-darken);
    background-color: var(--brand-developer-darken);
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

.tinted {
  font-weight: normal;
  border: 1px solid color-mix(in srgb, var(--link-button-tint, currentColor) var(--link-button-tint-line), transparent);
  background-color: color-mix(in srgb, var(--link-button-tint, currentColor) var(--link-button-tint-fill), transparent);
  color: inherit;

  &:is(:hover, :focus-visible) {
    background-color: color-mix(
      in srgb,
      var(--link-button-tint, currentColor) var(--link-button-tint-fill-hover),
      transparent
    );
    color: inherit;
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

/* A toggle that's off stays quiet in gray until it's pointed at. */
[aria-pressed='false'] {
  box-shadow: inset 0 0 0 1px var(--color-link-button-off-line);
  color: var(--color-link-button-off);

  &:is(:hover, :focus-visible) {
    color: inherit;
  }
}

/* A toggle that's on: the tinted look in og's red, quieter than the primary button. */
[aria-pressed='true'] {
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--brand-primary) var(--link-button-tint-line), transparent);
  background-color: color-mix(in srgb, var(--brand-primary) var(--link-button-tint-fill), transparent);
  color: inherit;

  &:is(:hover, :focus-visible) {
    background-color: color-mix(in srgb, var(--brand-primary) var(--link-button-tint-fill-hover), transparent);
    color: inherit;
  }
}
</style>
