<!--
  A calendar entry with no artwork: a small line with a premiere or finale tag and the air time and network (a
  grouped card's badge across from it), the show or movie in white, the episode number and title under it, and the
  quick-icon bar along the bottom.
    <CalendarTextCard {entry} {icons}>{#snippet overlay()}…{/snippet}</CalendarTextCard>
-->
<script lang="ts">
import QuickIcons from '$lib/components/media/QuickIcons.svelte';
import MediaSpoiler from '$lib/components/summary/MediaSpoiler.svelte';
import type { ComponentProps, Snippet } from 'svelte';
import type { CalendarEntry } from './CalendarEntry.ts';

interface Props {
  entry: CalendarEntry;
  icons: Omit<ComponentProps<typeof QuickIcons>, 'small'>;
  /** The top-right corner: a grouped card's episode badge. */
  overlay?: Snippet;
}

const { entry, icons, overlay }: Props = $props();

const tags = $derived(entry.tags ?? []);
const kinds = $derived(tags.filter((tag) => tag.kind && tag.kind !== 'generic' && tag.kind !== 'primary'));
const time = $derived(tags.find((tag) => !tag.kind)?.text);
const network = $derived(tags.find((tag) => tag.kind === 'generic')?.text);
const spoiler = $derived(icons.collectionTarget ?? icons.watchTarget ?? icons.ratingTarget);
// An episode's card names its show first; a movie's names the movie.
const heading = $derived(entry.smallTitle ?? { text: entry.title, href: entry.href });
</script>

<!-- Hrefs point at OG routes og hasn't built yet, and resolve() only takes routes that exist. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->

<article class={['text-card', { faded: entry.faded }]}>
  <div class="meta">
    {#each kinds as kind (kind.text)}<span class="kind" style:--kind="var(--episode-{kind.kind})">{kind.text}</span>{/each}
    <span class="when">{[time, network].filter(Boolean).join(' · ') || (entry.year ? 'Movie' : '')}</span>
    {@render overlay?.()}
  </div>
  <h3><a href={heading.href}>{heading.text}</a>{#if !entry.smallTitle && entry.year}<span class="year">
        {entry.year}</span>{/if}</h3>
  {#if entry.smallTitle}
    <p class="episode">
      {#if entry.number}<a class="number" href={entry.href}>{entry.number}</a>{' '}{/if}<MediaSpoiler target={spoiler}
        kind="title" inline><a href={entry.href}>{entry.title}</a></MediaSpoiler>
    </p>
  {/if}
  <QuickIcons {...icons} />
</article>

<style>
.text-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs-inline);
  block-size: 100%;
  padding: var(--space-base-inline) var(--space-base-inline) 0;
  background-color: var(--color-card-bg);
  transition: opacity 0.5s, background-color 0.2s;

  &:hover {
    background-color: var(--color-calendar-text-hover);
  }

  &.faded:not(:hover, :focus-within) {
    opacity: var(--opacity-faded);
  }

  & > :global(.quick-icons) {
    margin-block-start: auto;
    margin-inline: calc(-1 * var(--space-base-inline));
    background: none;
  }
}

.meta {
  display: flex;
  align-items: center;
  gap: var(--space-base-block);
  min-block-size: 24px;
  font-size: var(--font-size-small);

  /* The badge sits at the row's end instead of over artwork. */
  & :global(.badge) {
    position: static;
    margin-inline-start: auto;
  }
}

.kind {
  flex: none;
  padding: var(--calendar-worded-padding);
  border-radius: var(--radius-sm);
  background-color: var(--kind);
  color: var(--color-text-inverse);
  font-weight: var(--font-weight-menu-header);
  line-height: 1.2;
}

.when {
  overflow: hidden;
  color: var(--color-frame-muted);
  text-overflow: ellipsis;
  white-space: nowrap;
}

h3 {
  margin: var(--space-xs-block) 0 0;
  color: var(--color-frame-text);
  font-size: var(--calendar-text-title-size);
  font-weight: var(--font-weight-headings-heavy);
  line-height: 1.2;
  overflow-wrap: anywhere;

  /* A month's day is narrow: a smaller title keeps long names to a couple of lines. */
  @container (width < 240px) {
    font-size: var(--font-size-sidenav-subtitle);
  }
}

a {
  color: inherit;
  text-decoration: none;

  &:is(:hover, :focus-visible) {
    color: var(--brand-primary);
  }
}

.year {
  margin-inline-start: 0.25em;
  color: var(--color-frame-muted);
  font-weight: normal;
}

.episode {
  display: -webkit-box;
  margin: 0;
  overflow: hidden;
  color: var(--color-sidebar-pill-text);
  line-height: 1.35;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;

  & :global(.spoiler-content.inline) {
    display: inline;
  }
}

.number {
  color: var(--color-frame-text);
  font-weight: var(--font-weight-headings-heavy);
}
</style>
