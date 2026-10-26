<!--
  One calendar card, the same in the list and the month whatever the artwork: the art (none for Text), a caption with
  the titles and then a line of tag pills like search's (the certificate, runtime and network), then og's full
  quick-icon bar across the bottom. The caption's lines have fixed heights, so cards in a row line up whether or not
  they have a show line; a movie's title can take both. The red tags sit over the art's bottom-left corner: an
  episode's types (a premiere, a finale) and air time, or Movie on a calendar that mixes in shows. With no art, they
  lead the pill line. The logo sits in the middle of the art. A grouped card has its episodes pill in the art's
  top-right corner (at the end of the pill line for Text), with a tick per episode along the art's bottom edge.
    <CalendarEntryCard {entry} icons={cardIcons(entry)} artwork="logo" mixed />
-->
<script lang="ts">
import TagPills from '$lib/components/labels/TagPills.svelte';
import FanartCard from '$lib/components/media/FanartCard.svelte';
import CardTag from '$lib/components/media/CardTag.svelte';
import QuickIcons from '$lib/components/media/QuickIcons.svelte';
import type { ComponentProps } from 'svelte';
import type { CalendarArtwork } from './calendarDisplay.ts';
import type { CalendarEntry } from './CalendarEntry.ts';
import CalendarEntryTitles from './CalendarEntryTitles.svelte';
import CalendarEpisodes from './CalendarEpisodes.svelte';
import { calendarArtTags } from './calendarTags.ts';

interface Props {
  entry: CalendarEntry;
  icons: Omit<ComponentProps<typeof QuickIcons>, 'small'>;
  artwork: CalendarArtwork;
  /** Shows and movies on one calendar: a movie gets a Movie tag. */
  mixed?: boolean;
}

const { entry, icons, artwork, mixed = false }: Props = $props();

const group = $derived('group' in entry ? entry.group : undefined);
const artTags = $derived(calendarArtTags({ entry, mixed }));
const spoiler = $derived(icons.collectionTarget ?? icons.watchTarget ?? icons.ratingTarget);
</script>

<article class={['calendar-entry', artwork, { faded: entry.faded }]}>
  {#if artwork !== 'none'}
    <FanartCard {...entry} faded={false} titles={false} iconBar={false} episodeBadge={undefined}
      userRating={entry.state.rating} {icons}>
      {#snippet fanartOverlay()}
        {#if artTags.length > 0}<p class="types">{#each artTags as tag (tag.text)}<CardTag {...tag} />{/each}</p>{/if}
        {#if group}<CalendarEpisodes {group} released={entry.released} onArt />{/if}
      {/snippet}
    </FanartCard>
  {/if}
  <div class="caption">
    <div class="titles"><CalendarEntryTitles {entry} {spoiler} wrap /></div>
    <p class="tags">
      {#if artwork === 'none'}{#each artTags as tag (tag.text)}<CardTag {...tag} />{/each}{/if}
      <TagPills tags={entry.pills} />
      {#if group && artwork === 'none'}<span class="end"><CalendarEpisodes {group} released={entry.released} /></span>{/if}
    </p>
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

/* A poster card is narrow, so its pills are a step tighter, like search's. */
.poster .caption {
  --search-pill-padding: var(--search-poster-pill-padding);
  --font-size-search-pill: var(--font-size-search-poster-pill);
}

/*
 * One line of tags, kept when empty so cards line up. Pills that don't fit wrap out of sight; the last, the network,
 * shortens to an ellipsis first while a few letters still fit.
 */
.tags {
  display: flex;
  align-items: center;
  gap: var(--search-pill-gap);
  block-size: var(--calendar-tags-height);
  margin: 0;
  overflow: hidden;

  & :global(.card-tag) {
    flex: none;
  }

  & :global(.tag-pills) {
    flex: 1;
    align-self: start;
    min-inline-size: 0;
    block-size: var(--calendar-tags-height);
    overflow: hidden;
  }

  & :global(.tag-pills .pill:last-child:not(.segments)) {
    flex: 1 1 var(--calendar-network-min-width);
    max-inline-size: max-content;
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
