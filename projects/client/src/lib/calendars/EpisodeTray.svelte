<!--
  The episodes of a grouped calendar card, in the popup its badge opens: each row has its number, its title (kept hidden like
  any unwatched title when spoilers are off) and the episode's own watch, library and list icons.
    <EpisodeTray id="tray" show={1} title="The Diplomat" episodes={card.group.episodes} released />
-->
<script lang="ts">
import QuickIcons from '$lib/components/media/QuickIcons.svelte';
import { quickIconFill } from '$lib/components/media/quickIconFill';
import MediaSpoiler from '$lib/components/summary/MediaSpoiler.svelte';
import { page } from '$app/state';
import { overlay } from '$lib/overlay/overlay';
import type { CalendarGroupEpisode } from './toCalendarGroupCard.ts';

interface Props {
  id: string;
  show: number;
  title: string;
  episodes: readonly CalendarGroupEpisode[];
  /** The day has come: before it, nothing can be watched. */
  released?: boolean;
}

const { id, show, title, episodes, released }: Props = $props();

const target = (episode: CalendarGroupEpisode) => ({
  type: 'episode' as const,
  id: episode.id,
  title: `${title} ${episode.label}`,
  season: { show, number: episode.season, episode: episode.number },
  released,
});
const fill = (episode: CalendarGroupEpisode) =>
  quickIconFill({
    state: overlay.state('episode', episode.id, { show, number: episode.season, episode: episode.number }),
    datePreferences: page.data.datePreferences,
  });
</script>

<!-- Hrefs point at OG routes og hasn't built yet, and resolve() only takes routes that exist. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->

<ol {id} class="episode-tray" aria-label="{title} episodes">
  {#each episodes as episode (episode.id)}
    {@const item = target(episode)}
    <li>
      <a class="number" href={episode.href}>{episode.label}</a>
      <a class="title" href={episode.href}><MediaSpoiler target={item} kind="title" inline>{episode.title || 'TBA'}</MediaSpoiler></a>
      <QuickIcons small fill={fill(episode)} watchTarget={item} collectionTarget={item} listTarget={item}
        listLabel="Add to list" {released} />
    </li>
  {/each}
</ol>

<style>
.episode-tray {
  max-block-size: var(--episode-tray-height);
  margin: 0;
  padding: 0;
  overflow-y: auto;
  scrollbar-width: thin;
  list-style: none;
}

li {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: var(--space-sm-inline);
  padding-inline: var(--space-sm-inline) 0;
  border-radius: var(--radius-menu-row);

  &:hover {
    background-color: var(--color-menu-row-hover);
  }

  & :global(.quick-icons) {
    background: none;
  }
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
</style>
