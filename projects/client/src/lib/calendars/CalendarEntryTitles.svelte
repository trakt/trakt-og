<!--
  A calendar entry's titles: an episode names its show in a small gray line, then its number in bold and its title at
  full size; a movie is only its title. Each line is one line long and ends in an ellipsis. `align` sets where they sit
  in the space they're given: at the bottom on a card, so a movie's title shares a line with the episode titles beside
  it, or centered in an agenda row. `after` follows the title on its line: the agenda's episodes pill.
    <CalendarEntryTitles {entry} spoiler={icons.collectionTarget} align="end" />
-->
<script lang="ts">
import MediaSpoiler from '$lib/components/summary/MediaSpoiler.svelte';
import type { ComponentProps, Snippet } from 'svelte';
import type { CalendarEntry } from './CalendarEntry.ts';

interface Props {
  entry: CalendarEntry;
  spoiler: ComponentProps<typeof MediaSpoiler>['target'];
  align?: 'end' | 'center';
  after?: Snippet;
}

const { entry, spoiler, align = 'end', after }: Props = $props();
</script>

<!-- Hrefs point at OG routes og hasn't built yet, and resolve() only takes routes that exist. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->

<div class={['titles', align]}>
  {#if entry.smallTitle}
    <a class="show" href={entry.smallTitle.href}>{entry.smallTitle.text}</a>
  {/if}
  <h3 class={{ movie: !entry.smallTitle }}>
    <span class="text">{#if entry.number}<a class="number" href={entry.href}>{entry.number}&nbsp;</a>{/if}<MediaSpoiler
        target={spoiler} kind="title" inline><a href={entry.href}>{entry.title}</a></MediaSpoiler></span>{@render
      after?.()}
  </h3>
</div>

<style>
.titles {
  display: flex;
  flex-direction: column;
  min-inline-size: 0;

  &.end {
    justify-content: flex-end;
  }

  &.center {
    justify-content: center;
  }
}

a {
  color: inherit;
  text-decoration: none;

  &:is(:hover, :focus-visible) {
    text-decoration: underline;
  }
}

.show {
  overflow: hidden;
  color: var(--color-frame-ink-muted);
  font-size: var(--font-size-small);
  font-weight: var(--font-weight-headings);
  line-height: var(--calendar-show-line);
  text-overflow: ellipsis;
  white-space: nowrap;
}

h3 {
  display: flex;
  align-items: center;
  gap: var(--space-sm-inline);
  min-inline-size: 0;
  margin: 0;
  color: var(--color-frame-ink);
  font-size: var(--calendar-title-size);
  font-weight: normal;
  line-height: var(--calendar-title-line);

  &.movie {
    font-weight: var(--font-weight-headings-heavy);
  }
}

.text {
  min-inline-size: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  & :global(.spoiler-content.inline) {
    display: inline;
  }
}

.number {
  font-weight: var(--font-weight-headings-heavy);
}
</style>
