<!--
  A sign-in or sign-out page: the hyperspace loader with its scene's line while `run` sends the browser on. If that
  fails, Han's line turns to the trouble and AuthFailureNotice under it says why and runs `retry` (`run` unless
  given) after a countdown that grows with each failure (`retryDelaySeconds`), or at once with Try Again Now.
    <AuthStepScreen scene="signOut" run={logout} />
-->
<script lang="ts">
import HyperspaceLoader from '#lib/components/loading/HyperspaceLoader.svelte';
import { onMount } from 'svelte';
import AuthFailureNotice from './AuthFailureNotice.svelte';
import { type AuthFailure, toAuthFailure } from './authFailure.ts';
import { type AuthScene, authLine } from './authScenes.ts';
import { retryDelaySeconds } from './retryDelaySeconds.ts';

interface Props {
  scene: AuthScene;
  run: () => Promise<void>;
  retry?: () => Promise<void>;
}

const { scene, run, retry = run }: Props = $props();

let failure = $state<AuthFailure | null>(null);
let seconds = $state(0);
let failures = 0;
let countdown: ReturnType<typeof setInterval> | undefined;

async function attempt(step: () => Promise<void>) {
  clearInterval(countdown);
  failure = null;
  try {
    await step();
  } catch (error) {
    failure = toAuthFailure(error);
    failures += 1;
    seconds = retryDelaySeconds(failures);
    countdown = setInterval(() => {
      seconds -= 1;
      if (seconds <= 0) attempt(retry);
    }, 1000);
  }
}

onMount(() => {
  attempt(run);
  return () => clearInterval(countdown);
});
</script>

<HyperspaceLoader {...authLine(scene, failure)} reverse={scene === 'signOut'}>
  {#if failure}<AuthFailureNotice {failure} {seconds} onretry={() => attempt(retry)} />{/if}
</HyperspaceLoader>
