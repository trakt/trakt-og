<!--
  og's error page: full screen, outside the shell, dressed as the show or movie for its kind of error (errorScenes).
  Try again reruns the page's loads, so a fix shows the page in place. Losing the connection is OfflineGuard's. A 429
  from the API rate limiting the viewer is Trakt API Error, with the wait in its body.
-->
<script lang="ts">
import { invalidateAll } from '$app/navigation';
import { page } from '$app/state';
import ErrorScene from '$lib/components/error/ErrorScene.svelte';
import ErrorActions from './ErrorActions.svelte';
import { errorScenes } from './errorScenes.ts';
import { toErrorSceneKey } from './toErrorSceneKey.ts';

const scene = $derived(errorScenes[toErrorSceneKey(page.status)]);
// A rate-limited read says how long to wait (`apiRateLimited`).
const body = $derived(page.error?.rateLimited ? page.error.message : scene.body);
</script>

<svelte:head>
  <title>{scene.title} ({page.status}) - Trakt</title>
</svelte:head>

<ErrorScene theme={scene.theme} code={String(page.status)} label="Error {page.status} · {scene.name}" {body}>
  {#snippet actions()}<ErrorActions kind={scene.actions} onretry={invalidateAll} />{/snippet}
</ErrorScene>
