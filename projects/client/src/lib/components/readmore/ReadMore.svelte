<!--
  OG's readmore.js (`global.js:5512-5535`): text taller than 300px collapses under a fading shade, with a small pill
  centred on the shade's foot, "Read More" and a caret, that expands it and turns to "Read Less". Set `--read-more-shade` to the background the text sits on, and
  `--comment-collapsed-height: none` where OG never collapsed the text.
-->
<script lang="ts">
import Icon from '$lib/icons/Icon.svelte';
import caretDown from '$lib/icons/solid/caret-down.svg?raw';
import type { Snippet } from 'svelte';

interface Props {
  children: Snippet;
}

const { children }: Props = $props();
const id = $props.id();

// readmore.js left anything within its 16px height margin alone.
const HEIGHT_MARGIN = 16;

let collapsible = $state(false);
let expanded = $state(false);

const measure = (element: HTMLElement) => {
  const height = getComputedStyle(element).getPropertyValue('--collapsed-height').trim();
  if (height === 'none') return;
  const collapsed = Number.parseFloat(height) || 300;
  let frame = 0;
  const observer = new ResizeObserver(() => {
    cancelAnimationFrame(frame);
    // Updating the collapsed layout during ResizeObserver delivery can trigger a browser resize loop.
    frame = requestAnimationFrame(() => {
      collapsible = element.scrollHeight > collapsed + HEIGHT_MARGIN;
    });
  });
  observer.observe(element);
  return () => {
    cancelAnimationFrame(frame);
    observer.disconnect();
  };
};
</script>

<div
  id="{id}-text"
  class={['read-more', { collapsed: collapsible && !expanded, expanded: collapsible && expanded }]}
  {@attach measure}
>
  {@render children()}
  <div class="shade"></div>
</div>
{#if collapsible}
  <div class="toggle-row">
  <button
    type="button"
    class="toggle"
    aria-expanded={expanded}
    aria-controls="{id}-text"
    onclick={() => (expanded = !expanded)}
  >
      {expanded ? 'Read Less' : 'Read More'}<span class="caret"><Icon svg={caretDown} /></span>
    </button>
</div>
{/if}

<style>
.read-more {
  --collapsed-height: var(--comment-collapsed-height);
  position: relative;
}

.shade {
  display: none;
}

.collapsed {
  max-block-size: var(--collapsed-height);
  overflow: hidden;
  margin-block-end: var(--gutter);

  & .shade {
    display: block;
    position: absolute;
    inset: auto 0 0;
    block-size: var(--comment-shade-height);
    /* OG's shade swallowed clicks; the links and spoilers under it stay clickable here. */
    pointer-events: none;
    background-image: linear-gradient(
      color-mix(in srgb, var(--read-more-shade) 0%, transparent),
      var(--read-more-shade)
    );
  }
}

.expanded {
  margin-block-end: calc(var(--gutter) * 2);
}

/* A small pill centred under the text, pulled up onto the shade while it's collapsed. */
.toggle-row {
  display: flex;
  justify-content: center;
  margin-block-start: calc(-1 * var(--gutter) - var(--read-more-pull));
}

.expanded + .toggle-row {
  margin-block-start: calc(-2 * var(--gutter) + var(--read-more-gap));
}

.toggle {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: var(--read-more-gap);
  min-block-size: var(--read-more-height);
  padding: var(--read-more-padding);
  border: 1px solid var(--color-control-border);
  border-radius: var(--read-more-height);
  background-color: var(--color-control-bg);
  color: var(--color-control-text);
  font-family: var(--font-headings);
  font-size: var(--font-size-read-more);
  font-weight: var(--font-weight-headings);
  line-height: 1;
  cursor: pointer;
  transition: background-color var(--transition-comment-quiet), border-color var(--transition-comment-quiet);

  &:is(:hover, :focus-visible) {
    border-color: var(--color-control-border-hover);
    background-color: var(--color-control-hover-bg);
  }
}

.caret {
  display: inline-flex;
  color: var(--color-comment-muted);
  font-size: var(--font-size-read-more-caret);
  transition: rotate var(--transition-comment-quiet);

  [aria-expanded='true'] > & {
    rotate: 180deg;
  }
}

@media (prefers-reduced-motion: reduce) {
  .toggle,
  .caret {
    transition: none;
  }
}
</style>
