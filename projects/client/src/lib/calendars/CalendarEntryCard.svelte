<!--
  One calendar card, the same in the list and the month whatever the artwork: the art (none for Text), a caption with
  the card tags and the titles, then og's full quick-icon bar across the bottom. The caption's lines have fixed
  heights, so cards in a row line up whether or not they have a show line. An episode's types (a premiere, a finale)
  sit over the art's bottom-left corner, so the caption keeps one line of tags: the time and network, the network
  cut short on a narrow card. With no art, the types lead that line. The logo sits in the middle of the art. A grouped card has its episodes pill in the art's top-right corner
  (at the end of the tag line for Text), with a tick per episode along the art's bottom edge.
    <CalendarEntryCard {entry} icons={cardIcons(entry)} artwork="logo" mixed />
-->
<script lang="ts">
import FanartCard from '$lib/components/media/FanartCard.svelte';
import CardTag from '$lib/components/media/CardTag.svelte';
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
const tags = $derived(calendarTags({ entry, mixed }));
const spoiler = $derived(icons.collectionTarget ?? icons.watchTarget ?? icons.ratingTarget);
</script>

<article class={['calendar-entry', artwork, { faded: entry.faded }]}>
  {#if artwork !== 'none'}
    <FanartCard {...entry} faded={false} titles={false} iconBar={false} episodeBadge={undefined}
      userRating={entry.state.rating} {icons}>
      {#snippet fanartOverlay()}
        {#if tags.types.length > 0}<p class="types">{#each tags.types as tag (tag.text)}<CardTag {...tag} />{/each}</p>{/if}
        {#if group}<CalendarEpisodes {group} released={entry.released} onArt />{/if}
      {/snippet}
    </FanartCard>
  {/if}
  <div class="caption">
    <p class="tags">
      {#if artwork === 'none'}{#each tags.types as tag (tag.text)}<CardTag {...tag} />{/each}{/if}
      {#each tags.line as tag (tag.text)}<CardTag {...tag} />{/each}
      {#if group && artwork === 'none'}<span class="end"><CalendarEpisodes {group} released={entry.released} /></span>{/if}
    </p>
    <div class="titles"><CalendarEntryTitles {entry} {spoiler} /></div>
  </div>
  <QuickIcons {...icons} small={artwork === 'poster'} watchNowArt={entry.fanart} />
</article>

<style>
.calendar-entry {
  container-type: inline-size;
  display: flex;
  flex-direction: column;
  block-size: 100%;
  min-inline-size: 0;
  overflow: hidden;
  border: 1px solid var(--color-calendar-card-line);
  border-radius: var(--radius-calendar-card);
  background-color: var(--color-calendar-card);
  transition: opacity 0.5s;

  &.faded:not(:hover, :focus-within) {
    opacity: var(--opacity-faded);
  }

  /* A hairline between the caption and the bar, which is light like the card in the light theme. */
  & > :global(.quick-icons) {
    margin-block-start: auto;
    border-block-start: 1px solid var(--color-calendar-card-line);
  }

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

.caption {
  display: grid;
  gap: var(--calendar-caption-gap);
  padding: var(--calendar-caption-padding);
}

/* One line of tags, kept when empty so cards line up. The network gives way first, ending in an ellipsis. */
.tags {
  display: flex;
  align-items: center;
  gap: var(--space-xs-inline);
  block-size: var(--calendar-tags-height);
  margin: 0;
  overflow: hidden;

  & :global(.card-tag) {
    flex: none;
  }

  & :global(.card-tag.generic) {
    display: block;
    flex: 0 1 auto;
    min-inline-size: 0;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

/* An episode's types over the art's bottom-left corner, above the episodes' ticks. */
.types {
  position: absolute;
  inset-inline: var(--calendar-art-tag-inset);
  inset-block-end: var(--calendar-art-tag-inset);
  z-index: 2;
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-xs-inline);
  margin: 0;
  pointer-events: none;
}

/* A None card's episodes pill: at the line's right end. */
.end {
  margin-inline-start: auto;
}

.titles {
  display: grid;
  block-size: var(--calendar-titles-height);
}

/* Narrow cards (a month's day, a poster) keep every quick icon, just smaller and in a shorter bar. */
@container (width < 300px) {
  .calendar-entry.calendar-entry :global(.quick-icons) {
    --bar: var(--calendar-narrow-bar-height);
    --watch-card-height: var(--calendar-narrow-bar-height);
    --watch-card-small-height: var(--calendar-narrow-bar-height);
    --list-card-height: var(--calendar-narrow-bar-height);
    --list-card-small-height: var(--calendar-narrow-bar-height);
    --action-width: 26px;
    --watch-card-width: 26px;
    --watch-card-small-width: 26px;
    --list-card-width: 26px;
    --list-card-small-width: 26px;
    --font-size-quick-icon: 16px;
    --font-size-quick-icon-small: 15px;
    --font-size-rating: 14px;
    --font-size-rating-small: 13px;
    --font-size-rating-heart: 13px;
  }
}

@container (width < 190px) {
  .calendar-entry.calendar-entry :global(.quick-icons) {
    --action-width: 21px;
    --watch-card-width: 21px;
    --watch-card-small-width: 21px;
    --list-card-width: 21px;
    --list-card-small-width: 21px;
    --font-size-quick-icon: 13px;
    --font-size-quick-icon-small: 13px;
    --font-size-rating: 12px;
    --font-size-rating-small: 12px;
    --font-size-rating-heart: 11px;
  }
}

@container (width < 172px) {
  .calendar-entry.calendar-entry :global(.quick-icons) {
    --action-width: 19px;
    --watch-card-width: 19px;
    --watch-card-small-width: 19px;
    --list-card-width: 19px;
    --list-card-small-width: 19px;
    --font-size-quick-icon: 12px;
    --font-size-quick-icon-small: 12px;
    --font-size-rating: 11px;
    --font-size-rating-small: 11px;
    --font-size-rating-heart: 10px;
  }
}
</style>
