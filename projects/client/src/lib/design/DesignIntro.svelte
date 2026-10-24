<!-- The top of a design page: its group as a red tag, its title, a lead paragraph, then small facts as chips. -->
<script lang="ts">
import type { Snippet } from 'svelte';

interface Props {
  tag: string;
  title: string;
  lead: Snippet;
  facts?: readonly string[];
}

const { tag, title, lead, facts = [] }: Props = $props();
</script>

<header>
  <span class="tag">{tag}</span>
  <h1>{title}</h1>
  <p class="lead">{@render lead()}</p>
  {#if facts.length > 0}
    <ul>
      {#each facts as fact (fact)}<li>{fact}</li>{/each}
    </ul>
  {/if}
</header>

<style>
header {
  display: grid;
  justify-items: start;
  gap: var(--space-sm-inline);
}

.tag {
  padding: var(--space-xs-block) var(--space-sm-inline);
  border-radius: var(--radius-tag);
  background-color: var(--brand-primary);
  color: var(--color-design-nav-active);
  font-family: var(--font-headings);
  font-size: var(--font-size-design-eyebrow);
  font-weight: var(--font-weight-headings-heavy);
  letter-spacing: var(--letter-spacing-design-eyebrow);
  text-transform: uppercase;
}

h1 {
  margin: 0;
  font-size: var(--font-size-design-title);
  font-weight: var(--font-weight-design-title);
  letter-spacing: var(--letter-spacing-design-title);
}

.lead {
  max-inline-size: var(--design-note-width);
  margin: 0;
  color: var(--color-design-muted);
  font-size: var(--font-size-design-lead);
  line-height: var(--line-height-headings);
}

ul {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-xs-inline);
  margin: 0;
  padding: 0;
  list-style: none;
}

li {
  padding: var(--space-xs-block) var(--space-sm-inline);
  border: 1px solid var(--color-design-card-border);
  border-radius: var(--radius-round);
  background-color: var(--color-design-card);
  color: var(--color-design-muted);
  font-size: var(--font-size-small);
}
</style>
