<!--
  One part of a design demo: a titled block the nav links to under the open demo. Its content sits in the demo's
  padded column, or with `bleed` runs the stage's full width, for components that bring their own page column.
-->
<script lang="ts">
import { parameterize } from '$lib/utils/parameterize';
import type { Snippet } from 'svelte';
import { designToc } from './designToc.svelte.ts';

interface Props {
  title: string;
  /** A sentence on what to look for or try. Rich notes go in a `<p>` at the top of the content instead. */
  note?: string;
  bleed?: boolean;
  children: Snippet;
}

const { title, note, bleed = false, children }: Props = $props();
const id = $derived(parameterize(title));
const toc = designToc.get();

$effect(() => {
  const entry = { id, title };
  toc.add(entry);
  return () => toc.remove(entry.id);
});
</script>

<section class="demo-section" aria-labelledby={id}>
  <header>
    <h2 {id}>{title}</h2>
    {#if note}<p>{note}</p>{/if}
  </header>
  <div class={['content', { bleed }]}>
    {@render children()}
  </div>
</section>

<style>
.demo-section {
  padding-block: var(--design-section-gap) 0;
  background-color: transparent;
}

header {
  padding-inline: var(--design-stage-padding);
  padding-block-start: var(--space-lg-block);
  margin-block-end: var(--gutter);
  border-block-start: 1px solid var(--color-separator);
}

h2 {
  margin: 0;
  font-size: var(--font-size-h3);
  scroll-margin-block-start: var(--gutter);
}

p {
  max-inline-size: var(--design-note-width);
  margin: var(--space-sm-block) 0 0;
  color: var(--color-text-muted);
}

.content {
  padding-inline: var(--design-stage-padding);

  &.bleed {
    padding-inline: 0;
  }
}
</style>
