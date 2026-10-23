<!-- The top of a design page: its group, its title, then a lead paragraph and any lines under it. -->
<script lang="ts">
import type { Snippet } from 'svelte';

interface Props {
  eyebrow: string;
  title: string;
  lead: Snippet;
  children?: Snippet;
}

const { eyebrow, title, lead, children }: Props = $props();
</script>

<header>
  <p class="eyebrow">{eyebrow}</p>
  <h1>{title}</h1>
  <p class="lead">{@render lead()}</p>
  {#if children}<p class="meta">{@render children()}</p>{/if}
</header>

<style>
header {
  padding: var(--design-section-gap) var(--design-stage-padding) 0;
}

h1 {
  margin-block: var(--space-sm-block) 0;
}

.eyebrow {
  margin: 0;
  color: var(--brand-primary);
  font-family: var(--font-headings);
  font-size: var(--font-size-design-eyebrow);
  font-weight: var(--font-weight-headings);
  letter-spacing: var(--letter-spacing-design-eyebrow);
  text-transform: uppercase;
}

.lead {
  max-inline-size: var(--design-note-width);
  margin-block: var(--space-sm-block) 0;
  font-size: var(--font-size-design-lead);
  line-height: var(--line-height-headings);
}

.meta {
  margin-block: var(--space-sm-inline) 0;
  color: var(--color-text-muted);
  font-size: var(--font-size-small);
}
</style>
