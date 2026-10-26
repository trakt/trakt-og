<!--
  og's full-screen error pages, one per kind of error it can show, in a desktop-sized frame. OG's own 404, 500 and 422
  pages were film stills behind a centered quote; these keep the idea in og's own layout, so there's no OG screenshot
  to match.
-->
<script lang="ts">
import ErrorScene from '$lib/components/error/ErrorScene.svelte';
import DemoChoice from '$lib/design/DemoChoice.svelte';
import Specimen from '$lib/design/Specimen.svelte';
import ErrorActions from '$lib/errors/ErrorActions.svelte';
import type { ErrorSceneKey } from '$lib/errors/ErrorSceneKey';
import { errorScenes } from '$lib/errors/errorScenes';

const statuses: Readonly<Record<ErrorSceneKey, string>> = {
  notFound: '404',
  badLink: '400',
  broken: '500',
  upstream: '502',
  maintenance: '503',
  timeout: '504',
  offline: '',
};
const options = (Object.keys(statuses) as ErrorSceneKey[]).map((value) => ({
  value,
  label: statuses[value] ? `${statuses[value]} ${errorScenes[value].name}` : errorScenes[value].title,
}));

let key = $state<ErrorSceneKey>('notFound');
const scene = $derived(errorScenes[key]);
const status = $derived(statuses[key]);
</script>

<Specimen title="Error pages"
  note="Pick an error: each has its own still, line and motion layer, which stops with reduced motion. The still fades in from 30% across with no seam; the 500 is falling code alone. Offline is a dialog over the page, held until the connection is back. A 429 from the API rate limiting the viewer is Trakt API Error, its line swapped for how long to wait. The buttons do nothing here.">
  <DemoChoice label="Error" {options} bind:value={key} />
  <div class="frame">
    <ErrorScene
      preview
      theme={scene.theme}
      code={status || scene.title}
      label={status ? `Error ${status} · ${scene.name}` : scene.name}
      body={scene.body}
    >
      {#snippet actions()}<ErrorActions kind={scene.actions} onretry={() => {}} ondismiss={() => {}} />{/snippet}
    </ErrorScene>
  </div>
</Specimen>

<style>
.frame {
  display: grid;
  block-size: 760px;
  margin-block-start: var(--space-lg-block);
  overflow: hidden;
  border-radius: var(--radius-container);
}
</style>
