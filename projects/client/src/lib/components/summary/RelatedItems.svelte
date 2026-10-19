<!--
  OG's related band under a summary: a dark full-width section, "If you like <Title>, check out...", whose picks load as
  the band nears the viewport. RelatedPicks lays them out with what each shares with the title.
-->
<script lang="ts">
import Container from '$lib/components/container/Container.svelte';
import type { DatePreferences } from '$lib/settings/DatePreferences';
import type { RelatedPerson } from '$lib/summary/RelatedPerson';
import type { RelatedSource } from '$lib/summary/RelatedSource';
import type { RelatedCard } from '$lib/summary/toRelatedCard';
import LazySection from './LazySection.svelte';
import RelatedPicks from './RelatedPicks.svelte';

interface Props {
  /** The item's title, bold in the heading. */
  title: string;
  /** Its subgenres and people, to show what each pick shares. */
  source: RelatedSource;
  load: () => Promise<readonly RelatedCard[] | null>;
  loadPeople: (card: RelatedCard) => Promise<readonly RelatedPerson[] | null>;
  datePreferences: DatePreferences;
}

const { title, source, load, loadPeople, datePreferences }: Props = $props();
const id = $props.id();
</script>

<section class="related" aria-labelledby="{id}-heading">
  <Container>
    <h2 id="{id}-heading">If you like <strong>{title}</strong>, check out...</h2>
    <LazySection {load}>
      {#snippet children(cards)}
        <RelatedPicks {cards} {source} {title} {loadPeople} {datePreferences} />
      {/snippet}
    </LazySection>
  </Container>
</section>

<style>
.related {
  /* OG's `#recommendations-wrapper .grid-item`: white titles and no card borders on the dark band. */
  --color-text: var(--color-related-text);
  --color-card-border: transparent;
  /* The less and more pill hangs over the band's bottom edge. */
  position: relative;
  min-block-size: var(--related-min-height);
  /* Padding, not the h2's margin, which collapsed through the band and showed the page behind it. */
  padding-block: var(--gutter);
  background-color: var(--color-related-bg);
  color: var(--color-related-text);

  & h2 {
    margin-block: 0 var(--space-related-threads);
    color: var(--color-related-text);
  }

  & :global(.poster-grid-frame) {
    margin-block-end: 0;
  }
}

@media (width < 768px) {
  .related {
    min-block-size: 0;
  }
}
</style>
