<!--
  An episode's type (Season Finale, Series Premiere) as a card tag in its kind's color, over the bottom-left corner of
  the art, the way the calendar shows it. `inline` drops it into a card's own row of tags instead. Hidden when the
  viewer turns episode type tags off.
    <EpisodeTypeBadge label="Season Finale" kind="season-finale" />
-->
<script lang="ts">
import { page } from '$app/state';
import CardTag from './CardTag.svelte';

interface Props {
  label: string;
  kind:
    | 'series-premiere'
    | 'season-premiere'
    | 'mid-season-premiere'
    | 'mid-season-finale'
    | 'season-finale'
    | 'series-finale'
    | 'bonus'
    | 'trailer';
  inline?: boolean;
}
const { label, kind, inline = false }: Props = $props();
</script>

{#if !page.data.settings?.browsing?.hide_episode_type_tags}
  {#if inline}<CardTag text={label} {kind} />{:else}<span class="corner"><CardTag text={label} {kind} /></span>{/if}
{/if}

<style>
.corner {
  position: absolute;
  inset-inline-start: var(--episode-tag-inset);
  inset-block-end: var(--episode-tag-inset);
  z-index: 1;
  display: flex;
  max-inline-size: calc(100% - 2 * var(--episode-tag-inset));
  pointer-events: none;
}
</style>
