<!--
  Losing the connection never reaches the error page: SvelteKit falls back to a full page load when the root layout's
  data can't load, and the browser shows its own offline screen. So a navigation while the browser is offline is held
  here instead, under the offline scene, and loads once the connection is back. Escape or "Stay on this page"
  drops it.
-->
<script lang="ts">
import { beforeNavigate } from '$app/navigation';
import ErrorScene from '$lib/components/error/ErrorScene.svelte';
import ErrorActions from './ErrorActions.svelte';
import { errorScenes } from './errorScenes.ts';

const scene = errorScenes.offline;
let held = $state<URL>();

beforeNavigate(({ to, type, cancel }) => {
  if (navigator.onLine || !to || type === 'leave') return;
  cancel();
  held = to.url;
});

// A full load, not goto: hovering the link offline already failed its preload, and SvelteKit would reuse that failure.
// Still offline, it waits, or the browser would show its own offline screen after all.
const resume = () => navigator.onLine && held && location.assign(held);

const drop = () => (held = undefined);
const open = (dialog: HTMLDialogElement) => dialog.showModal();
</script>

<!-- The still has to be in the cache already: by the time it shows, there's no connection to fetch it. -->
<svelte:head>
  {#if scene.theme.art}<link rel="prefetch" href={scene.theme.art} as="image" />{/if}
</svelte:head>

<svelte:window ononline={held ? resume : undefined} />

{#if held}
  <dialog {@attach open} onclose={drop}>
    <ErrorScene theme={scene.theme} code={scene.title} label={scene.name} body={scene.body}>
      {#snippet actions()}<ErrorActions kind={scene.actions} onretry={resume} ondismiss={drop} />{/snippet}
    </ErrorScene>
  </dialog>
{/if}

<style>
dialog {
  inline-size: 100%;
  max-inline-size: none;
  block-size: 100%;
  max-block-size: none;
  margin: 0;
  padding: 0;
  border: 0;
  background: none;
}
</style>
