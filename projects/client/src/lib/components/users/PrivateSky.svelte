<!--
  The sky behind a private profile the viewer can't see: drifting stars, passing ships and a moon that isn't one, drawn
  by `privateSky`. When `requested` turns true because the viewer just sent a follow request, a courier ship leaves from
  `origin`, the hologram. It's null until the viewer's follow state streams in, so a request sent earlier doesn't
  launch one on load.
    <PrivateSky requested={false} origin={hologram} />
-->
<script lang="ts">
import { privateSky } from './sky/privateSky.ts';
import type { SkyControl } from './sky/SkyControl.ts';

interface Props {
  requested: boolean | null;
  origin?: HTMLElement;
}

const { requested, origin }: Props = $props();
let sky: SkyControl | undefined;
let known: boolean | null = null;

$effect(() => {
  if (known === false && requested === true && origin) sky?.launch(origin.getBoundingClientRect());
  known = requested;
});
</script>

<canvas aria-hidden="true" {@attach privateSky((control) => { sky = control; })}></canvas>

<style>
canvas {
  position: absolute;
  inset: 0;
  inline-size: 100%;
  block-size: 100%;
  font-family: var(--font-mono);
  font-size: var(--font-size-small);
  pointer-events: none;
}
</style>
