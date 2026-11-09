<!--
  One franchise in the Franchises tab's grid view: the movie the row's right card features as a poster card, with quick
  icons under it, or once every released movie is watched the caught up bar in their place (100%, and the date
  when another movie is to come), so the cards line up. The title is the movie's and the collection's name links its official list (caught up with
  nothing to come, the collection's name alone is the title), with the franchise's
  percent watched in the show grid's bar. It shimmers until `row` is read (`onneed`, as the row nears the screen).
-->
<script lang="ts">
import CardShimmer from '#lib/components/loading/CardShimmer.svelte';
import CaughtUpBar from '#lib/components/media/CaughtUpBar.svelte';
import PosterCard from '#lib/components/media/PosterCard.svelte';
import UnderProgress from '#lib/components/media/UnderProgress.svelte';
import type { WatchedProgress } from '#lib/components/media/WatchedProgress.ts';
import { overlay } from '#lib/overlay/overlay.ts';
import type { DatePreferences } from '#lib/settings/DatePreferences.ts';
import { nearViewport } from '#lib/utils/nearViewport.ts';
import type { Franchise } from './Franchise.ts';
import { franchiseHref } from './franchiseHref.ts';
import { franchiseMovieIcons } from './franchiseMovieIcons.ts';
import type { FranchiseRow } from './FranchiseRow.ts';

interface Props {
  franchise: Franchise;
  row?: FranchiseRow;
  datePreferences: DatePreferences;
  onneed: () => void;
}

const { franchise, row, datePreferences, onneed }: Props = $props();

const feature = $derived(row?.feature);
const state = $derived(feature && overlay.state('movie', feature.movie.id));
const finished = $derived(feature?.kind === 'caught-up');
const done = $derived<readonly WatchedProgress[]>([
  {
    verb: 'watched',
    percent: row?.percent ?? 0,
    completed: row?.watched ?? 0,
    aired: row?.released ?? 0,
    unit: 'movies',
    plays: row?.plays ?? 0,
    minutes: row?.watchedMinutes || undefined,
  },
]);
</script>

<div {@attach nearViewport(onneed)}>
  {#if row && feature && state}
    {#snippet caughtUp()}<CaughtUpBar next={feature.next} {datePreferences} short small />{/snippet}
    <PosterCard framed href={finished ? franchiseHref(franchise) : feature.movie.href}
      title={finished ? franchise.name : feature.movie.title} image={feature.movie.poster}
      userRating={finished ? undefined : state.rating}
      subtitles={finished ? [] : [{ text: franchise.name, href: franchiseHref(franchise) }]} detachedProgress
      icons={{ ...franchiseMovieIcons({ movie: feature.movie, state, datePreferences }), watchNow: 'play' }}
      bar={feature.kind === 'up-next' ? undefined : caughtUp}>
      {#snippet progress()}
        <UnderProgress href={franchiseHref(franchise)} percent={row.percent} tip={done} watched />
      {/snippet}
    </PosterCard>
  {:else}
    <CardShimmer ratio="poster" />
  {/if}
</div>
