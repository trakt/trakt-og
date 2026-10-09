<!--
  The episodes of a grouped calendar card, opened from its count: each with its number, title (kept hidden like any
  unwatched title when spoilers are off) and rating, and its own watch button.
    <EpisodeTray show={1} title="The Diplomat" episodes={card.group.episodes} />
-->
<script lang="ts">
import MediaWatch from '$lib/components/history/MediaWatch.svelte';
import MediaSpoiler from '$lib/components/summary/MediaSpoiler.svelte';
import type { CalendarGroupEpisode } from './toCalendarGroupCard.ts';

interface Props {
  id: string;
  show: number;
  title: string;
  episodes: readonly CalendarGroupEpisode[];
}

const { id, show, title, episodes }: Props = $props();
</script>

<!-- Hrefs point at OG routes og hasn't built yet, and resolve() only takes routes that exist. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->

<ol {id} class="episode-tray" aria-label="{title} episodes">
  {#each episodes as episode (episode.id)}
    {@const target = {
      type: 'episode' as const,
      id: episode.id,
      title: `${title} ${episode.label}`,
      season: { show, number: episode.season, episode: episode.number },
    }}
    <li>
      <a class="number" href={episode.href}>{episode.label}</a>
      <a class="title" href={episode.href}><MediaSpoiler {target} kind="title" inline>{episode.title || 'TBA'}</MediaSpoiler></a>
      {#if episode.rating}<span class="rating">{Math.trunc(episode.rating * 10)}%</span>{/if}
      <span class="watch"><MediaWatch {target} small /></span>
    </li>
  {/each}
</ol>

<style>
.episode-tray {
  display: grid;
  gap: var(--space-xs-block);
  margin: 0;
  padding: var(--space-sm-block);
  background-color: var(--color-date-separator);
  box-shadow: inset 0 3px 0 var(--brand-tertiary);
  list-style: none;
}

li {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto auto;
  align-items: center;
  gap: var(--space-sm-inline);
  padding-inline-start: var(--space-sm-inline);
  background-color: var(--color-card-bg);
}

a {
  color: var(--color-frame-text);
  text-decoration: none;

  &:is(:hover, :focus-visible) {
    text-decoration: underline;
  }
}

.number {
  font-weight: var(--font-weight-headings-heavy);
  font-variant-numeric: tabular-nums;
}

.title {
  overflow: hidden;
  color: var(--color-sidebar-pill-text);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rating {
  color: var(--color-frame-muted);
  font-size: var(--font-size-small);
  font-variant-numeric: tabular-nums;
}

.watch {
  display: flex;
}
</style>
