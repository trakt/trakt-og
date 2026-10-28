<!--
  A sign-in or sign-out page: the hyperspace loader with its scene's line while `run` sends the browser on. If that
  fails, a notice under the line says why and runs `retry` (`run` unless given) after a countdown that grows with
  each failure (`retryDelaySeconds`), or at once with Try again now.
    <AuthStepScreen scene="signOut" run={logout} />
-->
<script lang="ts">
import LinkButton from '$lib/components/button/LinkButton.svelte';
import HyperspaceLoader from '$lib/components/loading/HyperspaceLoader.svelte';
import { onMount } from 'svelte';
import { AUTH_FAILURE_MESSAGE, type AuthFailure, toAuthFailure } from './authFailure.ts';
import { AUTH_SCENES, type AuthScene } from './authScenes.ts';
import { formatWait, retryDelaySeconds } from './retryDelaySeconds.ts';

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

<HyperspaceLoader {...AUTH_SCENES[scene]} reverse={scene === 'signOut'}>
  {#if failure}
    <div class="notice">
      <!-- The countdown stays out of the alert, so screen readers don't hear every second of it. -->
      <p><span role="alert">{AUTH_FAILURE_MESSAGE[scene][failure]}</span> <span aria-hidden="true">Trying again in
        {formatWait(seconds)}.</span></p>
      <LinkButton onclick={() => attempt(retry)}>Try again now</LinkButton>
    </div>
  {/if}
</HyperspaceLoader>

<style>
.notice {
  display: grid;
  justify-items: center;
  gap: var(--space-sm-inline);
}

p {
  margin: 0;
}
</style>
