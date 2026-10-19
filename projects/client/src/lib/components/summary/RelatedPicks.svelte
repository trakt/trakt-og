<!--
  The related band once its picks land: a chip for each thread the picks share with the title (People with a swatch of
  its red blocks), then six poster cards with a fingerprint under each, and the less and more pill on the band's edge for up
  to two more rows. A pick's people load once its card shows, so each row asks for six. Picking a chip fades the cards
  without that thread, so the band never changes height. On phones, three fanart cards without threads, like OG's.
-->
<script lang="ts">
import { SvelteMap } from 'svelte/reactivity';
import FanartCard from '$lib/components/media/FanartCard.svelte';
import PosterCard from '$lib/components/media/PosterCard.svelte';
import PosterGrid from '$lib/components/media/PosterGrid.svelte';
import { quickIconFill } from '$lib/components/media/quickIconFill';
import PageNavigator from '$lib/components/page-navigator/PageNavigator.svelte';
import ToggleChips from '$lib/components/toggle-chips/ToggleChips.svelte';
import { overlay } from '$lib/overlay/overlay';
import type { DatePreferences } from '$lib/settings/DatePreferences';
import type { RelatedPerson } from '$lib/summary/RelatedPerson';
import type { RelatedSource } from '$lib/summary/RelatedSource';
import { relatedThreads } from '$lib/summary/relatedThreads';
import type { RelatedCard } from '$lib/summary/toRelatedCard';
import RelatedFingerprint from './RelatedFingerprint.svelte';

interface Props {
  cards: readonly RelatedCard[];
  source: RelatedSource;
  /** The summary's title. */
  title: string;
  loadPeople: (card: RelatedCard) => Promise<readonly RelatedPerson[] | null>;
  datePreferences: DatePreferences;
}

/** OG's `related(6)`: one row, and more opens the next, up to all the client loads. */
const PER_ROW = 6;
const PHONE_CARDS = 3;

const { cards, source, title, loadPeople, datePreferences }: Props = $props();

let rows = $state(1);
let filter = $state('');
// A card's entry goes in empty as its people are asked for, so each is asked once.
const people = new SvelteMap<number, readonly RelatedPerson[]>();

const band = $derived(relatedThreads({ source, cards, people }));
const shown = $derived(band.picks.slice(0, rows * PER_ROW));
const hasThreads = $derived(band.threads.length > 0);
const chips = $derived([
  { id: '', label: 'All' },
  // People get a swatch in their red; the subgenres are plainly the light blocks, and a swatch each would wrap the row.
  ...band.threads.map(({ id, label, count, people }) => ({
    id,
    label,
    count,
    ...(people ? { swatch: 'var(--color-related-fingerprint-people)' } : {}),
  })),
]);

$effect(() => {
  shown.filter(({ card }) => !people.has(card.id)).forEach(({ card }) => {
    people.set(card.id, []);
    loadPeople(card).then((found) => people.set(card.id, found ?? []), () => undefined);
  });
});

const icons = (card: RelatedCard) => {
  const state = overlay.state(card.type, card.id);
  return {
    fill: quickIconFill({ state, airedEpisodes: card.airedEpisodes, runtime: card.runtime, datePreferences }),
    ratingTarget: { type: card.type, id: card.id, title: card.title },
    collectionTarget: { type: card.type, id: card.id, title: card.title, airedEpisodes: card.airedEpisodes },
    rating: card.rating,
    released: card.released,
    // ponytail: OG showed watch now only with sources in the viewer's country. Until brings sources to cards,
    // anything not out yet is taken to have none, like the chart pages.
    watchNow: card.released ? ('play' as const) : undefined,
  };
};
</script>

<div class="posters">
  {#if hasThreads}
    <div class="threads">
      <ToggleChips label="Highlight the picks that share" options={chips} bind:selected={filter} />
    </div>
  {/if}
  <PosterGrid columns={PER_ROW}>
    {#each shown as pick (pick.card.id)}
      {@const card = pick.card}
      <PosterCard
        href={card.href}
        title={card.title}
        fullTitle={card.year ? `${card.title} (${card.year})` : card.title}
        image={card.poster}
        userRating={overlay.state(card.type, card.id).rating}
        dropped={overlay.state(card.type, card.id).dropped}
        faded={filter !== '' && !pick.threads.includes(filter)}
        icons={icons(card)}
      >
        {#if hasThreads}
          <RelatedFingerprint {pick} threads={band.threads} {title} filter={filter || undefined} />
        {/if}
      </PosterCard>
    {/each}
  </PosterGrid>
  <PageNavigator edge label="titles like {title}" {rows} maxRows={Math.ceil(cards.length / PER_ROW)}
    onchange={(next) => (rows = next)} />
</div>
<div class="fanarts">
  <PosterGrid columns={1}>
    {#each cards.slice(0, PHONE_CARDS) as card (card.id)}
      <FanartCard
        href={card.href}
        title={card.title}
        year={card.year}
        image={card.fanart}
        userRating={overlay.state(card.type, card.id).rating}
        dropped={overlay.state(card.type, card.id).dropped}
        icons={icons(card)}
      />
    {/each}
  </PosterGrid>
</div>

<style>
.threads {
  margin-block-end: var(--space-related-threads);
}

/* OG's `.hidden-xs` posters and `.visible-xs` fanarts. */
.fanarts {
  display: none;
}

@media (width < 768px) {
  .posters {
    display: none;
  }

  .fanarts {
    display: block;
  }
}
</style>
