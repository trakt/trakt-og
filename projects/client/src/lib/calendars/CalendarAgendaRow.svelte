<!--
  One agenda row: the artwork as a thumbnail (none for Text), the titles centered in their column with a grouped
  card's episodes pill after the title, the episode type and network as card tags, then og's quick-icon bar. Every row
  in a view is the same height.
    <CalendarAgendaRow {entry} icons={cardIcons(entry)} artwork="fanart" mixed />
-->
<script lang="ts">
import CardTag from '$lib/components/media/CardTag.svelte';
import FanartCard from '$lib/components/media/FanartCard.svelte';
import QuickIcons from '$lib/components/media/QuickIcons.svelte';
import type { ComponentProps } from 'svelte';
import type { CalendarArtwork } from './calendarDisplay.ts';
import type { CalendarEntry } from './CalendarEntry.ts';
import CalendarEntryTitles from './CalendarEntryTitles.svelte';
import CalendarEpisodes from './CalendarEpisodes.svelte';
import { calendarTags } from './calendarTags.ts';

interface Props {
  entry: CalendarEntry;
  icons: Omit<ComponentProps<typeof QuickIcons>, 'small'>;
  artwork: CalendarArtwork;
  /** Shows and movies on one calendar: a movie gets a Movie tag. */
  mixed?: boolean;
}

const { entry, icons, artwork, mixed = false }: Props = $props();

const group = $derived('group' in entry ? entry.group : undefined);
const tags = $derived(calendarTags({ entry, mixed, time: false }));
const spoiler = $derived(icons.collectionTarget ?? icons.watchTarget ?? icons.ratingTarget);
</script>

<article class={['agenda-row', artwork, { faded: entry.faded }]}>
  {#if artwork !== 'none'}
    <div class="thumb">
      <FanartCard {...entry} faded={false} titles={false} iconBar={false} episodeBadge={undefined}
        userRating={entry.state.rating} {icons} />
    </div>
  {/if}
  <CalendarEntryTitles {entry} {spoiler} align="center">
    {#snippet after()}
      {#if group}<CalendarEpisodes {group} released={entry.released} />{/if}
    {/snippet}
  </CalendarEntryTitles>
  <p class="tags">{#each [...tags.types, ...tags.line] as tag (tag.text)}<CardTag {...tag} />{/each}</p>
  <QuickIcons {...icons} watchNowArt={entry.fanart} />
</article>

<style>
.agenda-row {
  --thumb: var(--calendar-agenda-thumb-width);
  --columns: minmax(0, 1fr) minmax(0, var(--calendar-agenda-tags-width)) var(--calendar-agenda-actions-width);

  display: grid;
  grid-template-columns: var(--thumb) var(--columns);
  align-items: center;
  column-gap: var(--calendar-agenda-gap);
  block-size: var(--calendar-agenda-row-height);
  padding-inline-end: var(--space-sm-inline);
  transition: opacity 0.5s, background-color 0.2s;

  &:hover {
    background-color: var(--color-calendar-agenda-hover);
  }

  &.faded:not(:hover, :focus-within) {
    opacity: var(--opacity-faded);
  }

  &.poster {
    --thumb: var(--calendar-agenda-poster-width);
  }

  &.none {
    grid-template-columns: var(--columns);
    block-size: var(--calendar-agenda-text-row-height);
  }

  /* On the page instead of og's dark bar: the rating takes the page's ink. */
  & > :global(.quick-icons) {
    gap: var(--space-lg-inline);
    background: none;
    color: var(--color-frame-ink);
  }
}

/* The art at the row's height, rounded, with nothing over it but og's state marks. */
.thumb {
  overflow: hidden;
  border-radius: var(--radius-calendar-thumb);

  & :global(.fanart .logo) {
    inset-block: 0;
    max-inline-size: var(--calendar-logo-max-width);
    margin-block: auto;
  }

  /* The shade under titles on the art; there are none here, and on a thumbnail it would cover the logo. */
  & :global(.fanart .shadow-base) {
    display: none;
  }
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-xs-inline);
  margin: 0;
  overflow: hidden;
}
</style>
