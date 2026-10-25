<!--
  Report a bug and Request a feature, side by side: what to include, then a link to a new GitHub issue with its label
  already set.
-->
<script lang="ts">
import LinkButton from '$lib/components/button/LinkButton.svelte';
import TagPills from '$lib/components/labels/TagPills.svelte';
import Icon from '$lib/icons/Icon.svelte';
import bug from '$lib/icons/solid/bug.svg?raw';
import lightbulb from '$lib/icons/solid/lightbulb.svg?raw';
import { ogRepoUrls } from './ogRepoUrls.ts';

const CARDS = [
  {
    id: 'about-bug',
    title: 'Report a bug',
    tag: { text: 'Bug', kind: 'primary' },
    icon: bug,
    text: "Does something look wrong or not work how you expect? Open a bug on GitHub and we'll take a look.",
    include: [
      'The page link',
      'What you expected, and what happened',
      'A screenshot, plus your browser and screen size',
    ],
    href: ogRepoUrls.newBug,
    go: 'Open a bug report',
  },
  {
    id: 'about-feature',
    title: 'Request a feature',
    tag: { text: 'Feature', color: 'var(--brand-secondary)' },
    icon: lightbulb,
    text: "Missing something from classic Trakt, or have a new idea? Suggest it on GitHub and we'll start researching.",
    include: [
      'What you want to do',
      'Where it lived on classic Trakt, if it did',
      'Search first: someone may have asked already',
    ],
    href: ogRepoUrls.newFeature,
    go: 'Suggest a feature',
  },
] as const;
</script>

<div class="cards">
  {#each CARDS as card (card.id)}
    <section class="card" aria-labelledby={card.id}>
      <span class="icon"><Icon svg={card.icon} /></span>
      <h2 id={card.id}>{card.title} <TagPills tags={[card.tag]} /></h2>
      <p>{card.text}</p>
      <div>
        <ul>
          {#each card.include as item (item)}
            <li>{item}</li>
          {/each}
        </ul>
        <span class="go"><LinkButton href={card.href}>{card.go}</LinkButton></span>
      </div>
    </section>
  {/each}
</div>

<style>
.cards {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--gutter);
}

.card {
  display: grid;
  grid-template-columns: var(--about-card-columns);
  align-content: start;
  gap: var(--about-card-gap);
  padding: var(--about-card-padding);
  border-radius: var(--about-banner-radius);
  background: var(--color-panel-gray);
  box-shadow: 0 0 0 1px var(--color-home-line);
  transition: box-shadow var(--about-hover-duration), translate var(--about-hover-duration);

  &:has(.go :global(a:hover)) {
    box-shadow: 0 0 0 1px var(--brand-primary), var(--shadow-about-card-hover);
    translate: 0 var(--about-card-lift);
  }

  & > :not(.icon) {
    grid-column: 2;
  }
}

.icon {
  grid-row: span 3;
  display: grid;
  place-items: center;
  inline-size: var(--about-card-icon);
  block-size: var(--about-card-icon);
  border-radius: var(--about-card-icon-radius);
  background: var(--color-about-card-icon);
  color: var(--brand-primary);
  font-size: var(--about-card-glyph);
}

h2 {
  display: flex;
  align-items: center;
  gap: var(--about-repo-gap);
  margin: 0;
  font-size: var(--font-size-h4);
}

p {
  margin: 0;
  line-height: var(--line-height-about-body);
  color: var(--color-home-soft);
  text-wrap: balance;
}

ul {
  display: grid;
  gap: var(--home-credit-gap);
  margin: var(--about-card-list-space) 0 0;
  padding-inline-start: var(--about-card-list-indent);
  color: var(--color-home-muted);
}

.go {
  display: block;
  margin-block-start: var(--about-go-space);
}

@media (prefers-reduced-motion: reduce) {
  .card {
    transition: none;
  }
}
</style>
