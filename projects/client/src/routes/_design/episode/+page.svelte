<script lang="ts">
import ItemStatIcons from '$lib/components/media/ItemStatIcons.svelte';
import FanartHeader from '$lib/components/media/FanartHeader.svelte';
import EpisodeTitle from '$lib/components/summary/EpisodeTitle.svelte';
import Overview from '$lib/components/summary/Overview.svelte';
import SpoilerContent from '$lib/components/summary/SpoilerContent.svelte';
import Specimen from '$lib/design/Specimen.svelte';
</script>

<!-- eslint-disable svelte/no-navigation-without-resolve -->
<Specimen title="Episode title" bleed
  note="The show, season and episode links over the fanart, with the episode type.">
  <FanartHeader>
    <EpisodeTitle links={[{ title: 'American Horror Story', href: '/shows/american-horror-story' },
      { title: 'Season 12', href: '/shows/american-horror-story/seasons/12' },
      { title: 'Delicate', href: '/shows/american-horror-story/seasons/12' }]} number="12x01" title="Multiply Thy Pain"
      year={2023} certification="TV-MA" type={{ text: 'Season Premiere', kind: 'season-premiere' }} />
  </FanartHeader>
</Specimen>

<Specimen title="Community stat icons" note="Loaded, then the space they keep while loading.">
  <ItemStatIcons href="/shows/breaking-bad/seasons/1/episodes/1"
    stats={{ watchers: 4321, plays: 5678, collectors: 1234, lists: 987 }} comments={23} />
  <ItemStatIcons href="/shows/breaking-bad/seasons/1/episodes/1" />
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
