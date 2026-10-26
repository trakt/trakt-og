<!--
  The profile's Most Watched Shows and Most Watched Movies: two columns, each with a Period dropdown (Last 30 Days or
  All Time) over three posters with the time watched and plays under each title. The see-more link follows the picked
  period to the history page. Each column opens on its own default period and names its own order (the owner's saved
  ones on their profile).
  Below tablet width the third poster hides, and on phones the columns stack.
-->
<script lang="ts">
import Container from '$lib/components/container/Container.svelte';
import PanelHeading from '$lib/components/dashboard/PanelHeading.svelte';
import Dropdown from '$lib/components/dropdown/Dropdown.svelte';
import EmptyState from '$lib/components/empty/EmptyState.svelte';
import PosterCard from '$lib/components/media/PosterCard.svelte';
import { quickIconFill } from '$lib/components/media/quickIconFill';
import cameraMovie from '$lib/icons/regular/camera-movie.svg?raw';
import tvRetro from '$lib/icons/regular/tv-retro.svg?raw';
import { overlay } from '$lib/overlay/overlay';
import type { DatePreferences } from '$lib/settings/DatePreferences';
import { findAction } from '$lib/users/findAction';
import type { MostWatched, MostWatchedTab, MostWatchedType } from '$lib/users/profile/toMostWatched';

interface Props {
  shows: MostWatched;
  movies: MostWatched;
  slug: string;
  /** The Last 30 Days tab's first day, as the see-more link's `start_at`. */
  windowStart: string;
  /** Your own profile: an empty column links to where you'd start. */
  isSelf?: boolean;
  datePreferences: DatePreferences;
}

const { shows, movies, slug, windowStart, isSelf = false, datePreferences }: Props = $props();

const TABS = [{ id: 'lastMonth', label: 'Last 30 Days' }, { id: 'allTime', label: 'All Time' }] as const;

const columns = [
  { type: 'shows', title: 'Most Watched Shows', icon: tvRetro },
  { type: 'movies', title: 'Most Watched Movies', icon: cameraMovie },
] as const;

const data = $derived({ shows, movies });
// Each column opens on its default period until the viewer picks one.
const picked = $state<Partial<Record<MostWatchedType, MostWatchedTab>>>({});
const selected = (type: MostWatchedType) => picked[type] ?? data[type].tab;

// OG's see-more link, minus its sort segment: the history page only sorts by watched date and
// redirects it away. `start_at` is in UTC to the second with the colons left unescaped.
const seeMore = (type: MostWatchedType, tab: MostWatchedTab) =>
  `/users/${slug}/history/${type}${tab === 'lastMonth' ? `?start_at=${windowStart.replace(/\.\d+Z$/, 'Z')}` : ''}`;
</script>

<div class="most-watched">
  <Container>
    <div class="columns">
      {#each columns as column (column.type)}
        {@const headingId = `most-watched-${column.type}`}
        {@const period = selected(column.type)}
        {@const cards = data[column.type][period]}
        <section class="column" aria-labelledby={headingId}>
          <PanelHeading
            id={headingId}
            title={column.title}
            icon={column.icon}
            seeMore={{ href: seeMore(column.type, period), text: 'See more' }}
          />
          <div class="controls">
            <Dropdown section="Period">
              {#snippet trigger()}{TABS.find(({ id }) => id === period)?.label}{/snippet}
              <ul>
                {#each TABS as tab (tab.id)}
                  <li>
                    <button type="button" aria-current={tab.id === period} onclick={() => (picked[column.type] = tab.id)}
                      >{tab.label}</button>
                  </li>
                {/each}
              </ul>
            </Dropdown>
          </div>
          {#if cards.length > 0}
            <div class="posters">
              {#each cards as card (card.id)}
                {@const state = overlay.state(card.type, card.id)}
                <PosterCard
                  href={card.href}
                  title={card.title}
                  image={card.image}
                  subtitles={[card.time, card.plays]}
                  userRating={state.rating}
                  icons={{
                    fill: quickIconFill({ state, airedEpisodes: card.airedEpisodes, datePreferences }),
                    ratingTarget: { type: card.type, id: card.id, title: card.title },
                    watchTarget: { type: card.type, id: card.id, title: card.title, airedEpisodes: card.airedEpisodes },
                    rating: card.rating,
                    watchNow: 'play',
                    listLabel: 'Add to watchlist',
                  }}
                />
              {/each}
            </div>
          {:else if period === 'lastMonth' && data[column.type].allTime.length > 0}
            <EmptyState action={{ onclick: () => (picked[column.type] = 'allTime'), text: 'Show All Time' }} />
          {:else}
            <div class="empty">
              <EmptyState action={isSelf ? findAction(column.type) : undefined} />
            </div>
          {/if}
        </section>
      {/each}
    </div>
  </Container>
</div>

<style>
.most-watched {
  /* Holds the first heading's margin inside the background, like the clearfix on OG's container. */
  display: flow-root;
  background-color: var(--color-surface);
}

.columns {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--gutter);

  @media (max-width: 767px) {
    grid-template-columns: minmax(0, 1fr);
    gap: 0;
  }
}

.controls {
  padding-block-start: var(--space-heading-dropdowns);
}

.posters {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--gutter);
  margin-block-end: var(--gutter);
  padding-block-start: var(--gutter);

  /* OG's col-sm-6 below 992px: two posters, the third hidden. */
  @media (max-width: 991px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));

    & > :global(:nth-child(3)) {
      display: none;
    }
  }
}

.empty {
  padding-block-start: var(--gutter);
}
</style>
