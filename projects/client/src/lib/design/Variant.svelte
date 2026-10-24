<!-- One state inside a demo card, named by a small caption above it, like "Loading" or "Page 6 of 40". -->
<script lang="ts">
import type { Snippet } from 'svelte';

interface Props {
  label: string;
  children: Snippet;
}

const { label, children }: Props = $props();
</script>

<figure>
  <figcaption>{label}</figcaption>
  {@render children()}
</figure>

<style>
figure {
  display: grid;
  gap: var(--space-sm-block);
  min-inline-size: 0;
  margin: 0;
}

figcaption {
  color: var(--color-design-caption);
  font-family: var(--font-headings);
  font-size: var(--font-size-design-caption);
  font-weight: var(--font-weight-headings);
  letter-spacing: var(--letter-spacing-design-eyebrow);
  text-transform: uppercase;
}
</style>
