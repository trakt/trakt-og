<script lang="ts">
import Specimen from '$lib/design/Specimen.svelte';
import VisibilityControl from '$lib/components/visibility/VisibilityControl.svelte';
import PosterCard from '$lib/components/media/PosterCard.svelte';
import FanartCard from '$lib/components/media/FanartCard.svelte';
import PosterGrid from '$lib/components/media/PosterGrid.svelte';
import { quickIconFill } from '$lib/components/media/quickIconFill';
import { overlay } from '$lib/overlay/overlay';
import Icon from '$lib/icons/Icon.svelte';
import backward from '$lib/icons/light/backward.svg?raw';
import minus from '$lib/icons/light/circle-minus.svg?raw';
import ban from '$lib/icons/regular/ban.svg?raw';
const target = { type: 'show', id: 1388, title: 'Breaking Bad' } as const;
const icons = $derived({
  ratingTarget: target,
  fill: quickIconFill({ state: overlay.state('show', target.id), airedEpisodes: 62 }),
  hide: 'show',
  hideSection: 'recommendations' as const,
});
</script>
<!-- eslint-disable svelte/no-navigation-without-resolve -->
<Specimen title="The controls"
  note="Rewatch, drop, the Dropped pill's restore, and hide. Sign in to try the date picker and confirmations.">
  <div class="examples">
    <VisibilityControl {target} action="rewatch">
      <Icon svg={backward} />
    </VisibilityControl>
    <VisibilityControl {target} action="drop">
      <Icon svg={minus} />
    </VisibilityControl>
    <VisibilityControl {target} action="restore" variant="pill">Dropped</VisibilityControl>
    <VisibilityControl {target} action="hide" section="recommendations" variant="card">
      <Icon svg={ban} />
    </VisibilityControl>
  </div>
</Specimen>

<Specimen title="Poster and fanart actions"
  note="Hide from recommendations on a poster, and from the calendar on a fanart card.">
  <PosterGrid columns={6}>
    <PosterCard href="/shows/breaking-bad" title="Breaking Bad" image="/favicon.svg" {icons} />
    <FanartCard href="/shows/breaking-bad" title="Breaking Bad" image="/favicon.svg"
      icons={{ ...icons, hideSection: 'calendar' }} />
  </PosterGrid>
</Specimen>

<style>
.examples {
  display: grid;
  grid-template-columns: repeat(4, var(--action-icon-width));
  gap: var(--space-xs-inline);
}
</style>
