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
import { mediaQuickIcons } from '$lib/components/media/mediaQuickIcons';
import masksTheater from '$lib/icons/regular/masks-theater.svg?raw';
import { overlay } from '$lib/overlay/overlay';
import type { DatePreferences } from '$lib/settings/DatePreferences';
import type { MoodShelf } from './MoodShelf.ts';
import ToggleChips from '$lib/components/toggle-chips/ToggleChips.svelte';

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
      <Dropdown section="Media">
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
            icons={mediaQuickIcons({ item, state: viewer, datePreferences })}
          />
        {/each}
      </PosterGrid>
    {/if}
  </section>
{/if}

<style>
.moods {
  background: none;

  /* The page's 60px bottom padding is the whole gap under the shelf: no grid margin on top of it. */
  & :global(.poster-grid-frame) {
    margin-block-end: 0;
  }
}

.controls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-dropdown-row);
  margin-block: var(--space-heading-dropdowns) var(--discover-heading-margin);
}
</style>
