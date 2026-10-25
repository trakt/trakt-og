<script lang="ts">
import ItemStatIcons from '$lib/components/media/ItemStatIcons.svelte';
import FanartHeader from '$lib/components/media/FanartHeader.svelte';
import EpisodeTitle from '$lib/components/summary/EpisodeTitle.svelte';
import Overview from '$lib/components/summary/Overview.svelte';
import RatingsStrip from '$lib/components/summary/RatingsStrip.svelte';
import SpoilerContent from '$lib/components/summary/SpoilerContent.svelte';
import Specimen from '$lib/design/Specimen.svelte';
import Variant from '$lib/design/Variant.svelte';
import { overlay } from '$lib/overlay/overlay';
import { breakingBad, pilot } from '../summary/fixtures.ts';

const ratingTarget = { type: 'episode', id: pilot.id, title: pilot.fullTitle } as const;
</script>

<!-- eslint-disable svelte/no-navigation-without-resolve -->
<Specimen title="Episode header" bleed
  note="The show and season links over the screenshot, the episode type, then the ratings strip. Rate it from the strip.">
  <FanartHeader dropped={overlay.state('show', breakingBad.id).dropped} image={breakingBad.fanart}
    screenshot={pilot.screenshot}>
    <EpisodeTitle target={ratingTarget} links={pilot.parents} number={pilot.number} title={pilot.title}
      year={pilot.year} certification={breakingBad.certification} type={pilot.episodeType} />
    {#snippet stats()}
      <RatingsStrip rating={{ value: pilot.rating, votes: pilot.votes, href: `${pilot.href}/stats` }}
        external={pilot.external} rateLabel="episode" {ratingTarget} statsHref="{pilot.href}/stats" />
    {/snippet}
  </FanartHeader>
</Specimen>

<Specimen title="Community stat icons"
  note="An episode row's counts. Zero counts drop out, and before an episode airs only its list count shows. While the row's stats load, each count they bring shimmers.">
  <Variant label="Aired">
    <ItemStatIcons href={pilot.href} stats={pilot.stats} comments={pilot.comments} />
  </Variant>
  <Variant label="Not aired yet">
    <ItemStatIcons href={pilot.href} stats={pilot.stats} comments={pilot.comments} released={false} />
  </Variant>
  <Variant label="Loading">
    <ItemStatIcons href={pilot.href} comments={pilot.comments} loading />
  </Variant>
</Specimen>

<Specimen title="Spoilers" note="A hidden overview, then inline spoilers on a title and a rating.">
  <SpoilerContent hidden={true}>
    <Overview overview="An unexpected visitor forces everyone to rethink their plans." />
  </SpoilerContent>
  <h3><strong>1x01</strong> <SpoilerContent hidden inline>Pilot</SpoilerContent></h3>
  <SpoilerContent hidden inline>
    <a href="/shows/breaking-bad/seasons/1/episodes/1/stats">82% · 1,600 votes</a>
  </SpoilerContent>
</Specimen>
