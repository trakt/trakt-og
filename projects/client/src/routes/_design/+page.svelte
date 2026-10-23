<!-- The design system's front page: every demo by group, each a card with what it shows. -->
<script lang="ts">
import { resolve } from '$app/paths';
import { designCatalog } from '$lib/design/designCatalog';
import DesignIntro from '$lib/design/DesignIntro.svelte';
import { parameterize } from '$lib/utils/parameterize';

const index = resolve('/_design');
const count = designCatalog.reduce((sum, { demos }) => sum + demos.length, 0);
</script>

<!-- Each demo is its own static route under the resolved index, so resolve() has nothing to add. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->
<DesignIntro eyebrow="og" title="Design system">
  {#snippet lead()}
    Every component og builds, on made-up data, in both themes. Use it to check a change in every state at once, or to
    find what already exists before building something new. Tokens live in <code>$lib/styles/tokens.css</code>.
  {/snippet}
  {count} demos in {designCatalog.length} groups
</DesignIntro>

{#each designCatalog as group (group.name)}
  <section aria-labelledby="group-{parameterize(group.name)}">
  <h2 id="group-{parameterize(group.name)}">{group.name}</h2>
  <ul>
      {#each group.demos as demo (demo.slug)}
        <li>
          <a href="{index}/{demo.slug}">
            <span class="title">{demo.title}</span>
            <span class="summary">{demo.summary}</span>
            <span class="meta">
              <code>$lib/{demo.source}</code>
              {#if demo.page}<span class="tag">Full page</span>{/if}
            </span>
          </a>
        </li>
      {/each}
    </ul>
</section>
{/each}

<style>
section {
  padding: var(--design-section-gap) var(--design-stage-padding) 0;
  background-color: transparent;
}

h2 {
  margin: 0 0 var(--space-lg-block);
  font-size: var(--font-size-h4);
}

ul {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: var(--space-base-inline);
  margin: 0;
  padding: 0;
  list-style: none;
}

a {
  display: grid;
  grid-template-rows: auto 1fr auto;
  gap: var(--space-sm-block);
  block-size: 100%;
  padding: var(--space-base-inline) var(--gutter);
  border: 1px solid var(--color-design-card-border);
  border-radius: var(--radius-object);
  color: inherit;
  text-decoration: none;

  &:hover {
    border-color: var(--brand-primary);
    background-color: var(--color-design-card-hover);
  }
}

.title {
  font-family: var(--font-headings);
  font-size: var(--font-size-large);
  font-weight: var(--font-weight-headings);
}

.summary {
  color: var(--color-text-muted);
}

.meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-sm-inline);
  font-size: var(--font-size-small);
}

.tag {
  padding: 0 var(--space-xs-inline);
  border-radius: var(--radius-tag);
  background-color: var(--color-separator);
  color: var(--color-text-muted);
  white-space: nowrap;
}
</style>
