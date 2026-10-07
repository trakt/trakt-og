<!--
  `/discover`, Seasons & Moods: a page that changes with the calendar. The season hero comes from the month map, with
  the year's themes edge to edge under it, then the mood shelves, upcoming premieres on their own band, the essential
  lists as a full-width accordion, the month's lists, and trending comments over full-width fanart at the foot. The
  whole page takes the season's accent.
-->
<script lang="ts">
import Container from '$lib/components/container/Container.svelte';
import type { DatePreferences } from '$lib/settings/DatePreferences';
import DiscoverLists from './DiscoverLists.svelte';
import EssentialLists from './EssentialLists.svelte';
import type { loadDiscover } from './loadDiscover.ts';
import MoodShelves from './MoodShelves.svelte';
import SeasonHero from './SeasonHero.svelte';
import SeasonRibbon from './SeasonRibbon.svelte';
import TrendingComments from './TrendingComments.svelte';
import UpcomingPremieres from './UpcomingPremieres.svelte';

type Props = { data: Awaited<ReturnType<typeof loadDiscover>> & { datePreferences: DatePreferences } };

const { data }: Props = $props();
</script>

<svelte:head>
  <title>Discover new TV shows & movies - Trakt</title>
  <meta
    name="description"
    content="This month's picks on Trakt, shelves for every mood, upcoming premieres, trending comments and the lists the Trakt community is liking."
  />
</svelte:head>

<div class={['discover', { 'no-hero': data.picks.length === 0 }]}
  style:--season-accent="var(--color-season-{data.theme.id})">
  <h1 class="visually-hidden">Discover</h1>
  {#if data.picks.length > 0}
    <SeasonHero
      title={data.theme.title}
      eyebrow={data.eyebrow}
      picks={data.picks}
    />
  {/if}
  <SeasonRibbon months={data.ribbon} />
  <Container>
    <div class="body">
      <MoodShelves moods={data.moods} datePreferences={data.datePreferences} />
    </div>
  </Container>
  {#if data.premieres.length > 0}
    <div class="band">
      <Container>
        <div class="body">
          <UpcomingPremieres premieres={data.premieres} today={data.today} datePreferences={data.datePreferences} />
        </div>
      </Container>
    </div>
  {/if}
  <EssentialLists lists={data.essentials} />
  <Container>
    <div class="body">
      <DiscoverLists lists={data.lists} season={data.theme.title} />
    </div>
  </Container>
  <TrendingComments items={data.comments} datePreferences={data.datePreferences} />
</div>

<style>
.discover {
  background-color: var(--color-discover-bg);
  color: var(--color-discover-text);

  & :global(section[id]) {
    scroll-margin-block-start: var(--header-height);
  }
}

@media (prefers-reduced-motion: no-preference) {
  :global(html:has(.discover)) {
    scroll-behavior: smooth;
  }
}

.body {
  display: grid;
  gap: var(--discover-section-gap);
  padding-block: var(--discover-padding-block);
}

/* Upcoming premieres sit on their own band, a step off the page in either theme. */
.band {
  background-color: var(--color-discover-band-bg);
}

/* With no hero, the page still starts below the fixed header. */
.no-hero {
  padding-block-start: var(--header-height);
}

.visually-hidden {
  position: absolute;
  inline-size: 1px;
  block-size: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}
</style>
