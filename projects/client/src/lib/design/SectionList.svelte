<!-- The open demo's sections, beside it on wide screens, with the one in view marked. -->
<script lang="ts">
import type { DesignTocEntry } from './designToc.svelte.ts';

interface Props {
  sections: readonly DesignTocEntry[];
  current: string | undefined;
}

const { sections, current }: Props = $props();
</script>

{#if sections.length > 0}
  <nav aria-label="On this page">
  <h2>On this page</h2>
  <ul>
      {#each sections as section (section.id)}
        <li>
          <a href="#{section.id}" aria-current={section.id === current ? 'location' : undefined}>{section.title}</a>
        </li>
      {/each}
    </ul>
</nav>
{/if}

<style>
nav {
  position: sticky;
  inset-block-start: var(--gutter);
  display: grid;
  gap: var(--space-sm-block);
}

h2 {
  margin: 0;
  color: var(--color-design-caption);
  font-size: var(--font-size-design-eyebrow);
  letter-spacing: var(--letter-spacing-design-eyebrow);
  text-transform: uppercase;
}

ul {
  margin: 0;
  padding: 0;
  list-style: none;
}

a {
  display: block;
  padding: var(--space-xs-inline) 0 var(--space-xs-inline) var(--space-sm-inline);
  border-inline-start: 2px solid var(--color-design-card-border);
  color: var(--color-design-muted);
  font-size: var(--font-size-small);
  text-decoration: none;

  &:hover {
    color: var(--color-text);
  }

  &[aria-current='location'] {
    border-color: var(--brand-primary);
    color: var(--color-text);
    font-weight: var(--font-weight-headings);
  }
}
</style>
