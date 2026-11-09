<!--
  One movie in a franchise's grid: the poster card with its quick icons, the full release date under the title and its
  runtime under that. The movie up next wears OG's "Up next" tag over its poster; for one not out yet, the quick icons
  lock its watch icon, as they do for any unreleased title.
-->
<script lang="ts">
import CardTag from '#lib/components/media/CardTag.svelte';
import PosterCard from '#lib/components/media/PosterCard.svelte';
import { overlay } from '#lib/overlay/overlay.ts';
import type { DatePreferences } from '#lib/settings/DatePreferences.ts';
import { formatDate } from '#lib/utils/formatDate.ts';
import { formatRuntime } from '#lib/utils/formatRuntime.ts';
import type { FranchiseRow } from './FranchiseRow.ts';
import { franchiseMovieIcons } from './franchiseMovieIcons.ts';

interface Props {
  movie: FranchiseRow['movies'][number];
  upNext: boolean;
  datePreferences: DatePreferences;
}

const { movie, upNext, datePreferences }: Props = $props();

const state = $derived(overlay.state('movie', movie.id));
const subtitles = $derived([
  formatDate(movie.releaseDate, { ...datePreferences, timeZone: 'UTC' }),
  ...(movie.runtime > 0 ? [formatRuntime(movie.runtime)] : []),
]);
</script>

<PosterCard framed href={movie.href} title={movie.title} image={movie.poster} userRating={state.rating} {subtitles}
  icons={{ ...franchiseMovieIcons({ movie, state, datePreferences }), watchNow: 'play' }}>
  {#snippet posterOverlay()}
    {#if upNext}<span class="tag"><CardTag text="Up next" kind="primary" /></span>{/if}
  {/snippet}
</PosterCard>

<style>
.tag {
  position: absolute;
  inset-block-end: var(--space-xs-inline);
  inset-inline-start: var(--space-xs-inline);
  z-index: 1;
  pointer-events: none;
}
</style>
