<!--
  An error page's own way out, ahead of the status and support buttons every scene has: home (with the white Trakt
  mark, now the scene has no logo of its own), try again, or, held offline, try again or stay on the page.
-->
<script lang="ts">
import TraktMark from '$lib/components/brand/TraktMark.svelte';
import LinkButton from '$lib/components/button/LinkButton.svelte';
import type { errorScenes } from './errorScenes.ts';

interface Props {
  kind: (typeof errorScenes)[keyof typeof errorScenes]['actions'];
  onretry: () => void;
  ondismiss?: () => void;
}

const { kind, onretry, ondismiss }: Props = $props();
</script>

{#if kind === 'home'}
  <LinkButton href="/">
    <svg class="mark" viewBox="0 0 98.1 98.1" aria-hidden="true"><TraktMark ink="var(--color-text-inverse)" /></svg>
    Home
  </LinkButton>
{:else}
  <LinkButton onclick={onretry}>Try Again</LinkButton>
  {#if kind === 'reconnect' && ondismiss}
    <LinkButton onclick={ondismiss} variant="tinted">Stay on this page</LinkButton>
  {/if}
{/if}

<style>
.mark {
  inline-size: var(--error-scene-home-mark-size);
  block-size: var(--error-scene-home-mark-size);
}
</style>
