<!--
  OG's `.subnav-wrapper.season-links` under a show's fanart: a label ("Order", "Season", "Episode") and a row of links
  drawn as the pill tabs, the current one in their picked red. Render it in SummaryFrame's `subnav` slot. A long row
  scrolls sideways.
-->
<script lang="ts">
import type { Attachment } from 'svelte/attachments';
import Container from '$lib/components/container/Container.svelte';

interface Link {
  readonly text: string;
  readonly href: string;
  readonly selected?: boolean;
}

const { label, links }: { label: string; links: readonly Link[] } = $props();
const revealSelected: Attachment<HTMLUListElement> = (element) => {
  const selected = links.findIndex((link) => link.selected);
  const item = element.children.item(selected);
  if (item instanceof HTMLElement) element.scrollLeft = item.offsetLeft - element.offsetLeft;
};
</script>

<!-- Hrefs come in as props, and resolve() only takes literal routes. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->

<nav class="season-links" aria-label={label}>
  <Container>
    <div class="inner">
      <span class="label" aria-hidden="true">{label}</span>
      <ul {@attach revealSelected}>
        {#each links as link (link.href)}
          <li>
            <a href={link.href} class={{ selected: link.selected }} aria-current={link.selected ? 'page' : undefined}
            >{link.text}</a>
          </li>
        {/each}
      </ul>
    </div>
  </Container>
</nav>

<style>
.season-links {
  background: var(--color-toolbar-bg);
  color: var(--color-season-links-label);
}

.inner {
  display: flex;
  align-items: center;
  gap: var(--season-links-gap);
  min-block-size: var(--season-links-height);
  padding-inline-start: var(--summary-offset);

  @media (width < 992px) {
    padding-inline-start: var(--summary-offset-sm);
  }

  @media (width < 768px) {
    padding-inline-start: 0;
  }
}

.label {
  flex: none;
  font-family: var(--font-headings);
  font-size: var(--font-size-season-links-label);
  font-weight: var(--font-weight-headings);
  letter-spacing: var(--letter-spacing-season-links-label);
  text-transform: uppercase;
}

/* Room above and below so the pills' focus rings aren't cut off by the scroll. */
ul {
  display: flex;
  gap: var(--toggle-chip-gap);
  margin: 0;
  padding: var(--season-links-pad) 0;
  overflow-x: auto;
  white-space: nowrap;
  list-style: none;
  scrollbar-width: none;
}

a {
  display: inline-flex;
  align-items: center;
  min-block-size: var(--tab-height);
  padding: 0 var(--season-links-pill-padding);
  border: 1px solid var(--color-control-border);
  border-radius: var(--radius-control);
  background-color: var(--color-control-bg);
  color: var(--color-control-text);
  font-size: var(--font-size-tab);
  font-weight: var(--font-weight-control);
  font-variant-numeric: tabular-nums;
  line-height: 1;
  text-decoration: none;

  &:hover {
    border-color: var(--color-control-border-hover);
    background-color: var(--color-control-hover-bg);
    color: var(--color-control-text);
    text-decoration: none;
  }
}

.selected {
  border-color: var(--color-tab-picked-border);
  background-color: var(--color-tab-picked-bg);
  color: var(--color-tab-picked-text);
  font-weight: var(--font-weight-headings-heavy);

  &:hover {
    border-color: var(--color-tab-picked-border);
    background-color: var(--color-tab-picked-bg-hover);
    color: var(--color-tab-picked-text);
  }
}

@media (prefers-reduced-motion: no-preference) {
  a {
    transition: background-color var(--transition-season-ribbon), border-color var(--transition-season-ribbon);
  }
}
</style>
