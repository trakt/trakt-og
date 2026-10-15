<!--
  v3's post-credits tag after a movie's or episode's title: the pale tag pill with how many extra scenes there are,
  and a tooltip saying when they play. Nothing renders without a scene.
    <PostCreditsTag during={movie.videos.duringCredits} after={movie.videos.afterCredits} />
-->
<script lang="ts">
import TagPills from '$lib/components/labels/TagPills.svelte';
import Tooltip from '$lib/components/tooltip/Tooltip.svelte';
import { postCredits } from './postCredits.ts';

const { during, after }: { during?: boolean | null; after?: boolean | null } = $props();
const scenes = $derived(postCredits({ during, after }));
</script>

{#if scenes}
  <Tooltip text={scenes.hint}>
    {#snippet trigger(tooltip)}
      <span class="post-credits" {...tooltip}>
        <TagPills tags={[{ text: `Post credits · ${scenes.count}`, kind: 'light' }]} />
      </span>
    {/snippet}
  </Tooltip>
{/if}

<style>
/* Inline after the certification, and clear of the title's shadow. */
.post-credits {
  display: inline-flex;
  margin-inline-start: var(--summary-title-tag-gap);
  vertical-align: middle;
  text-shadow: none;
  cursor: default;
}
</style>
