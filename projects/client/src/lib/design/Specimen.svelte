<!--
  One part of a design demo, as a card: its title and note, a Light or Dark override for just this card, and a dotted
  canvas the component sits on. `row` lays the content out side by side; `bleed` drops the canvas padding and dots
  for components that bring their own page column. The section list links to it and follows it as it scrolls by.
-->
<script lang="ts">
import { parameterize } from '$lib/utils/parameterize';
import type { Snippet } from 'svelte';
import { designToc } from './designToc.svelte.ts';

type Scheme = 'light' | 'dark';

interface Props {
  title: string;
  /** A sentence on what to look for or try. Rich notes go in a `<p>` at the top of the content instead. */
  note?: string;
  bleed?: boolean;
  row?: boolean;
  children: Snippet;
}

const { title, note, bleed = false, row = false, children }: Props = $props();
const id = $derived(parameterize(title));
const toc = designToc.get();
const schemes: readonly { value: Scheme; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];
let scheme = $state<Scheme>();

$effect(() => {
  const entry = { id, title };
  toc.add(entry);
  return () => toc.remove(entry.id);
});

/** Marks this card current while its top is in the upper part of the view. */
function follow(node: HTMLElement) {
  const observer = new IntersectionObserver(
    ([entry]) => {
      if (entry?.isIntersecting) toc.show(id);
    },
    { rootMargin: '0px 0px -70% 0px' },
  );
  observer.observe(node);
  return () => observer.disconnect();
}
</script>

<section class="specimen" aria-labelledby={id} {@attach follow}>
  <header>
    <div class="heading">
      <h2 {id}><a href="#{id}">{title}</a></h2>
      {#if note}<p>{note}</p>{/if}
    </div>
    <div class="tools" role="group" aria-label="Preview {title} in">
      {#each schemes as option (option.value)}
        <button type="button" aria-pressed={scheme === option.value}
          onclick={() => (scheme = scheme === option.value ? undefined : option.value)}>{option.label}</button>
      {/each}
    </div>
  </header>
  <div class={['canvas', { bleed, row }]} style:color-scheme={scheme}>
    {@render children()}
  </div>
</section>

<style>
.specimen {
  border: 1px solid var(--color-design-card-border);
  border-radius: var(--radius-object);
  background-color: var(--color-design-card);
  overflow: hidden;
}

header {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: var(--gutter);
  padding: var(--space-base-inline) var(--gutter);
  border-block-end: 1px solid var(--color-design-card-border);
}

.heading {
  display: grid;
  gap: var(--space-xs-block);
  min-inline-size: 0;
}

h2 {
  margin: 0;
  font-size: var(--font-size-design-card-title);
  scroll-margin-block-start: var(--gutter);

  & a {
    color: inherit;
    text-decoration: none;

    &:hover {
      color: var(--brand-primary);
    }
  }
}

p {
  max-inline-size: var(--design-note-width);
  margin: 0;
  color: var(--color-design-muted);
  font-size: var(--font-size-small);
}

.tools {
  display: flex;
  flex-shrink: 0;
  gap: var(--space-xs-inline);
}

button {
  padding: var(--space-xs-block) var(--space-sm-inline);
  border: 1px solid var(--color-design-card-border);
  border-radius: var(--radius-tag);
  background: none;
  color: var(--color-design-muted);
  font-size: var(--font-size-small);
  cursor: pointer;

  &:hover {
    color: var(--color-text);
  }

  &[aria-pressed='true'] {
    border-color: var(--color-design-tool-on);
    background-color: var(--color-design-tool-on);
    color: var(--color-design-tool-on-text);
  }
}

.canvas {
  display: grid;
  gap: var(--design-card-gap);
  padding: var(--design-canvas-padding);
  background-color: var(--color-design-canvas);
  background-image: radial-gradient(var(--color-design-dot) 1px, transparent 1px);
  background-size: var(--design-dot-spacing) var(--design-dot-spacing);
  color: var(--color-text);

  &.row {
    display: flex;
    flex-wrap: wrap;
    align-items: start;
  }

  &.bleed {
    padding: 0;
    background-color: var(--color-surface);
    background-image: none;
  }
}
</style>
