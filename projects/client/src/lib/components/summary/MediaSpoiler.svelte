<script lang="ts">
import { page } from '$app/state';
import { AnalyticsEvent } from '#lib/analytics/AnalyticsEvent.ts';
import { useTrack } from '#lib/analytics/useTrack.ts';
import { overlay } from '#lib/overlay/overlay.ts';
import { mediaSpoilers } from '#lib/settings/mediaSpoilers.ts';
import type { SpoilerTarget } from '#lib/settings/SpoilerTarget.ts';
import type { Snippet } from 'svelte';
import SpoilerContent from './SpoilerContent.svelte';

const { target, kind, inline = false, children }: {
  target?: SpoilerTarget;
  kind: keyof ReturnType<typeof mediaSpoilers>;
  inline?: boolean;
  children: Snippet;
} = $props();
const hidden = $derived(
  target && page.data.user
    ? mediaSpoilers({
      spoilers: page.data.settings?.browsing?.spoilers,
      type: target.type,
      watched: overlay.state(target.type, target.id, target.season).watched,
    })[kind]
    : false,
);
// trakt-web leaves season reveals untracked.
const onreveal = $derived.by(() => {
  const type = target?.type;
  if (type !== 'movie' && type !== 'show' && type !== 'episode') return undefined;
  return () => useTrack(AnalyticsEvent.SpoilerReveal).track({ type });
});
</script>

{#key `${page.data.user?.slug}:${target?.type}:${target?.id}:${kind}`}
  <SpoilerContent {hidden} {inline} {onreveal}>{@render children()}</SpoilerContent>
{/key}
