<!--
  "What are you in the mood for?": the standard panel heading with its watermark and a "View more" to the picked
  mood's chart, the mood chips (the season's first) with a Movies/Shows switch on the right, and the picked shelf of
  six poster cards with their quick icons. Every shelf comes with the page, so switching is instant. A mood the other
  type doesn't have falls back to the season's.
-->
<script lang="ts">
import PanelHeading from '$lib/components/dashboard/PanelHeading.svelte';
import Dropdown from '$lib/components/dropdown/Dropdown.svelte';
import PosterCard from '$lib/components/media/PosterCard.svelte';
import PosterGrid from '$lib/components/media/PosterGrid.svelte';
import { quickIconFill } from '$lib/components/media/quickIconFill';
import masksTheater from '$lib/icons/regular/masks-theater.svg?raw';
import { overlay } from '$lib/overlay/overlay';
import type { DatePreferences } from '$lib/settings/DatePreferences';
import type { MoodShelf } from './MoodShelf.ts';
import ToggleChips from './ToggleChips.svelte';

interface Props {
  moods: { readonly movie: readonly MoodShelf[]; readonly show: readonly MoodShelf[] };
  datePreferences: DatePreferences;
}

const { moods, datePreferences }: Props = $props();
let type = $state<'movie' | 'show'>('movie');
let picked = $state('season');
const TYPES = [{ id: 'movie', label: 'Movies' }, { id: 'show', label: 'Shows' }] as const;
const shelves = $derived(moods[type]);
const mood = $derived(shelves.find(({ id }) => id === picked) ?? shelves.at(0));
</script>

{#if moods.movie.length > 0 || moods.show.length > 0}
  <section id="moods" class="moods" aria-labelledby="moods-heading">
    <PanelHeading
      id="moods-heading"
      title="What are you in the mood for?"
      icon={masksTheater}
      seeMore={mood ? { href: mood.more, text: 'View more' } : undefined}
    />
    <div class="controls">
      <Dropdown>
        {#snippet trigger()}{type === 'movie' ? 'Movies' : 'Shows'}{/snippet}
        <ul>
          {#each TYPES as option (option.id)}
            <li>
              <button type="button" aria-current={option.id === type} onclick={() => (type = option.id)}>
                {option.label}
              </button>
            </li>
          {/each}
        </ul>
      </Dropdown>
      <ToggleChips label="Moods" options={shelves.map(({ id, label }) => ({ id, label }))} bind:selected={picked} />
    </div>
    {#if mood}
      <PosterGrid>
        {#each mood.items as item (item.key)}
          {@const viewer = overlay.state(item.type, item.id)}
          <PosterCard
            href={item.href}
            title={item.title}
            fullTitle={item.year ? `${item.title} (${item.year})` : item.title}
            image={item.poster}
            userRating={viewer.rating}
            dropped={viewer.dropped}
            icons={{
              fill: quickIconFill({ state: viewer, airedEpisodes: item.airedEpisodes, runtime: item.runtime, datePreferences }),
              ratingTarget: { type: item.type, id: item.id, title: item.title },
              watchTarget: {
                type: item.type,
                id: item.id,
                title: item.title,
                airedEpisodes: item.airedEpisodes,
                runtime: item.runtime,
              },
              rating: item.released ? item.rating : undefined,
              watchNow: item.released ? 'play' : undefined,
            }}
          />
        {/each}
      </PosterGrid>
    {/if}
  </section>
{/if}

<style>
.moods {
  background: none;
}

.controls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--toggle-chip-gap);
  margin-block: var(--discover-heading-margin);
}
</style>
