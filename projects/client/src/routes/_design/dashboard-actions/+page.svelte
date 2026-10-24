<script lang="ts">
import Specimen from '$lib/design/Specimen.svelte';
import OnDeckCard from '$lib/components/media/OnDeckCard.svelte';
import PosterGrid from '$lib/components/media/PosterGrid.svelte';
import { toOnDeckItem } from '$lib/progress/toOnDeckItem';
import { upNextFixture } from '$lib/progress/upNextFixture';

const entry = upNextFixture.entries.at(0);
const sample = entry ? toOnDeckItem({ entry, username: 'me' }) : undefined;
let needsRefresh = $state(true);
</script>

<Specimen title="Card states"
  note="Next Episode (refresh it once), refreshing, a completed returning show and an ended show. The Next Episode cover works from the keyboard.">
  {#if sample}
    <div class="panel">
      <PosterGrid columns={6}>
        <OnDeckCard item={sample} {needsRefresh} onRefresh={() => { needsRefresh = false; }} />
        <OnDeckCard item={sample} refreshing />
        <OnDeckCard item={{ ...sample, complete: true, completionLabel: 'Returns next season!', progress: { ...sample.progress, completed: sample.progress.aired } }} />
        <OnDeckCard item={{ ...sample, complete: true, completionLabel: 'Ended', progress: { ...sample.progress, completed: sample.progress.aired } }} />
      </PosterGrid>
    </div>
  {/if}
</Specimen>

<style>
/* The dashboard panel's ground. */
.panel {
  padding: var(--gutter);
  background: var(--color-panel-gray);
  color: var(--color-text);
}
</style>
