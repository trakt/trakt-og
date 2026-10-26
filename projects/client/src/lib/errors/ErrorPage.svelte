<!--
  og's error page: full screen, outside the shell, dressed as the show or movie for its kind of error (errorScenes).
  Try again reruns the page's loads, so a fix shows the page in place. Losing the connection is OfflineGuard's.
-->
<script lang="ts">
import { invalidateAll } from '$app/navigation';
import { page } from '$app/state';
import ErrorScene from '$lib/components/error/ErrorScene.svelte';
import ErrorActions from './ErrorActions.svelte';
import { errorScenes } from './errorScenes.ts';
import { toErrorSceneKey } from './toErrorSceneKey.ts';

const scene = $derived(errorScenes[toErrorSceneKey(page.status)]);
</script>

<svelte:head>
  <title>{scene.title} ({page.status}) - Trakt</title>
</svelte:head>

<ErrorScene theme={scene.theme} code={String(page.status)} label="Error {page.status} · {scene.name}" body={scene.body}>
  {#snippet actions()}<ErrorActions kind={scene.actions} onretry={invalidateAll} />{/snippet}
</ErrorScene>
