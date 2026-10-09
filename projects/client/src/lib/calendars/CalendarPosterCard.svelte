<!--
  A calendar entry with poster artwork: the poster alone, nothing laid over it but a grouped card's badge, then a
  caption under it (the air time and network, a premiere or finale in its color, then the episode number and title or
  the movie's title and year) and the quick-icon bar.
    <CalendarPosterCard {entry} {icons}>{#snippet badge()}…{/snippet}</CalendarPosterCard>
-->
<script lang="ts">
import QuickIcons from '$lib/components/media/QuickIcons.svelte';
import MediaSpoiler from '$lib/components/summary/MediaSpoiler.svelte';
import type { ComponentProps, Snippet } from 'svelte';
import type { CalendarEntry } from './CalendarEntry.ts';

interface Props {
  entry: CalendarEntry;
  icons: Omit<ComponentProps<typeof QuickIcons>, 'small'>;
  /** Over the poster's top-right corner: a grouped card's episode badge, and its watched strip. */
  overlay?: Snippet;
}

const { entry, icons, overlay }: Props = $props();

const tags = $derived(entry.tags ?? []);
const kinds = $derived(tags.filter((tag) => tag.kind && tag.kind !== 'generic' && tag.kind !== 'primary'));
const time = $derived(tags.find((tag) => !tag.kind)?.text);
const network = $derived(tags.find((tag) => tag.kind === 'generic')?.text);
const spoiler = $derived(icons.collectionTarget ?? icons.watchTarget ?? icons.ratingTarget);
</script>

<!-- Hrefs point at OG routes og hasn't built yet, and resolve() only takes routes that exist. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->

<article class={['poster-card', { faded: entry.faded }]}>
  <div class="poster">
    <a href={entry.href} tabindex="-1" aria-hidden="true">
      {#if entry.image}<img src={entry.image} alt="" loading="lazy" decoding="async" />{/if}
    </a>
    {@render overlay?.()}
  </div>
  <div class="caption">
    {#if kinds.length > 0}
      <p class="kinds">{#each kinds as kind (kind.text)}<span style:--kind="var(--episode-{kind.kind})">{kind.text}</span
        >{/each}</p>
    {/if}
    {#if time || network}<p class="when">{[time, network].filter(Boolean).join(' · ')}</p>{/if}
    <h3>
      {#if entry.number}<a class="number" href={entry.href}>{entry.number}</a>{' '}{/if}<MediaSpoiler
        target={spoiler} kind="title" inline><a href={entry.href}>{entry.title}</a></MediaSpoiler>{#if entry.year}<span
          class="year"> {entry.year}</span>{/if}
    </h3>
  </div>
  <QuickIcons {...icons} small />
</article>

<style>
.poster-card {
  display: flex;
  flex-direction: column;
  block-size: 100%;
  background-color: var(--color-card-bg);
  transition: opacity 0.5s;

  &.faded:not(:hover, :focus-within) {
    opacity: var(--opacity-faded);
  }

  & > :global(.quick-icons) {
    margin-block-start: auto;
  }
}

.poster {
  position: relative;
  aspect-ratio: var(--ratio-poster);
  overflow: hidden;
  background: var(--image-placeholder-poster) center / cover;

  & a,
  & img {
    display: block;
    inline-size: 100%;
    block-size: 100%;
  }

  & img {
    object-fit: cover;
  }
}

.caption {
  display: grid;
  gap: 2px;
  padding: var(--space-base-block) var(--space-sm-inline) var(--space-xs-inline);
  min-inline-size: 0;
}

.kinds {
  display: flex;
  flex-wrap: wrap;
  gap: 0 var(--space-base-block);
  margin: 0;
  font-size: var(--font-size-small);
  font-weight: var(--font-weight-headings-heavy);

  & span {
    color: color-mix(in srgb, var(--kind) 70%, white);
  }
}

.when {
  margin: 0;
  overflow: hidden;
  color: var(--color-frame-muted);
  font-size: var(--font-size-small);
  text-overflow: ellipsis;
  white-space: nowrap;
}

h3 {
  display: -webkit-box;
  margin: 0;
  overflow: hidden;
  color: var(--color-frame-text);
  font-size: var(--font-size-base);
  font-weight: normal;
  line-height: 1.3;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;

  & a {
    color: inherit;
    text-decoration: none;

    &:is(:hover, :focus-visible) {
      text-decoration: underline;
    }
  }

  & :global(.spoiler-content.inline) {
    display: inline;
  }
}

.number {
  font-weight: var(--font-weight-headings-heavy);
}

.year {
  margin-inline-start: 0.25em;
  color: var(--color-frame-muted);
}
</style>
