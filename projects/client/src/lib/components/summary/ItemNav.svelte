<!--
  OG's previous and next arrows on a summary's fanart (`#previous-item-link`, `#next-item-link`), as small glass
  circles centered in the fanart between the site header and the ratings strip, plus its keys:
  p or Left follows the previous link, n or Right the next, u goes up a level (movie to collection, episode to
  season). Render it in FanartHeader's `edges` slot. The keys stay quiet while you type or hold a modifier.
-->
<script lang="ts">
import { goto } from '$app/navigation';
import { swipeDirection } from './swipeDirection.ts';
import Icon from '$lib/icons/Icon.svelte';
import angleLeft from '$lib/icons/regular/angle-left.svg?raw';
import angleRight from '$lib/icons/regular/angle-right.svg?raw';

interface Link {
  readonly href: string;
  /** The accessible name, e.g. "Previous in Star Wars Collection: Star Wars". */
  readonly label: string;
}

interface Props {
  previous?: Link;
  next?: Link;
  up?: string;
}

const { previous, next, up }: Props = $props();

function onkeydown(event: KeyboardEvent) {
  if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
  if (event.target instanceof HTMLElement && event.target.closest('input, textarea, select, [contenteditable]')) return;

  const href = {
    p: previous?.href,
    ArrowLeft: previous?.href,
    n: next?.href,
    ArrowRight: next?.href,
    u: up,
  }[event.key];
  if (!href) return;
  if (document.querySelector('dialog[open], [popover]:popover-open')) return;

  event.preventDefault();
  // eslint-disable-next-line svelte/no-navigation-without-resolve -- hrefs are built by the page from API slugs
  goto(href);
}
let touch: { x: number; y: number } | null = null;
function ontouchstart(event: TouchEvent) {
  touch = null;
  if (event.touches.length !== 1) return;
  if (
    event.target instanceof HTMLElement && event.target.closest('a, button, input, textarea, select, [contenteditable]')
  ) return;
  if (document.querySelector('dialog[open], [popover]:popover-open')) return;
  const point = event.touches.item(0);
  if (point) touch = { x: point.clientX, y: point.clientY };
}
function ontouchend(event: TouchEvent) {
  const start = touch;
  touch = null;
  const point = event.changedTouches.item(0);
  if (!start || !point) return;
  const direction = swipeDirection({ start, end: { x: point.clientX, y: point.clientY } });
  const href = direction === 'next' ? next?.href : direction === 'previous' ? previous?.href : undefined;
  // eslint-disable-next-line svelte/no-navigation-without-resolve -- API slug links
  if (href) goto(href);
}
</script>

<svelte:window {onkeydown} {ontouchstart} {ontouchend} />

<!-- Hrefs come in as props, and resolve() only takes literal routes. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->

{#if previous}
  <a class="item-nav previous" href={previous.href} rel="prev" aria-label={previous.label}>
  <span class="arrow"><Icon svg={angleLeft} /></span>
</a>
{/if}
{#if next}
  <a class="item-nav next" href={next.href} rel="next" aria-label={next.label}>
  <span class="arrow"><Icon svg={angleRight} /></span>
</a>
{/if}

<style>
/* Centered in the fanart that shows: below the site header, above the strip (`--item-nav-band`, set by FanartHeader). */
.item-nav {
  position: absolute;
  inset-block-start: calc((var(--header-height) + 100% - var(--item-nav-band, 0px)) / 2);
  z-index: 100;
  display: grid;
  place-items: center;
  inline-size: var(--item-nav-size);
  block-size: var(--item-nav-size);
  border: 1px solid var(--color-item-nav-line);
  border-radius: 50%;
  background-color: var(--color-item-nav-bg);
  backdrop-filter: var(--blur-header-glass);
  color: var(--color-item-nav-text);
  font-size: var(--font-size-item-nav-icon);
  line-height: 1;
  translate: 0 -50%;
  transition: background-color var(--transition-card), border-color var(--transition-card), color
    var(--transition-card);

  &:is(:hover, :focus-visible) {
    border-color: var(--color-item-nav-line-hover);
    background-color: var(--color-item-nav-hover);
    color: var(--color-card-text);
  }
}

.arrow {
  display: inline-flex;
  transition: translate var(--transition-card);
}

.previous {
  inset-inline-start: var(--space-item-nav);

  &:is(:hover, :focus-visible) .arrow {
    translate: calc(-1 * var(--space-item-nav-nudge)) 0;
  }
}

.next {
  inset-inline-end: var(--space-item-nav);

  &:is(:hover, :focus-visible) .arrow {
    translate: var(--space-item-nav-nudge) 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .item-nav,
  .arrow {
    transition: none;
  }
}
</style>
