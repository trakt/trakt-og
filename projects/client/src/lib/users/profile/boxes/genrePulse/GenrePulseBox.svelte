<!--
  Genre Pulse: the genre running hot this month as the hero, its welcome wizard icon faint in the corner (the theater
  masks for a genre the wizard doesn't list), with how far above its usual share as a pale pill and its
  shares in one plain line, and the month's next genre that's up too in the band.
-->
<script lang="ts">
import { genreIconFor } from '#lib/components/first-night/genreIcons.ts';
import TagPills from '#lib/components/labels/TagPills.svelte';
import ProfileBox from '#lib/components/users/profile-box/ProfileBox.svelte';
import up from '#lib/icons/solid/angle-up.svg?raw';
import masks from '#lib/icons/solid/masks-theater.svg?raw';
import type { GenrePulseView } from './GenrePulseView.ts';

const { view }: { view: GenrePulseView } = $props();
const mark = $derived(genreIconFor(view.hot.slug) ?? masks);
</script>

{#snippet foot()}
  {#if view.alsoUp}Also up: <b>{view.alsoUp.name}</b> {view.alsoUp.now}%, usually {view.alsoUp.usual}%{/if}
{/snippet}

<ProfileBox label="Genre Pulse" tone="genre" {mark} foot={view.alsoUp ? foot : undefined}>
  <p class="hot">
    {view.hot.name} <span class="jump"
      ><TagPills tags={[{ icon: up, text: view.spike, kind: 'light', label: `${view.spike} its usual share` }]} /></span>
  </p>
  <p class="shares"><b>{view.hot.now}%</b> of this month, usually <b>{view.hot.usual}%</b></p>
</ProfileBox>

<style>
/* The genre in the big condensed figures, wrapping onto a second line when it's long. */
.hot {
  margin: 0;
  font-family: var(--font-profile-figure);
  font-size: var(--font-size-profile-figure);
  font-weight: var(--font-weight-profile-figure);
  line-height: 0.8;
  text-transform: uppercase;
  overflow-wrap: anywhere;
}

/* The pale pill's bottom on the genre's baseline (a clipped inline-block's baseline is its bottom edge), its icon in
   the pill's own dark text. */
.jump {
  --color-tag-pill-icon: var(--color-tag-pill-light-text);
  display: inline-block;
  overflow: hidden;
  font-family: var(--font-headings);
  text-transform: none;
  vertical-align: baseline;
}

.shares {
  margin: 0;
  color: var(--color-profile-ink-soft);
  font-size: var(--font-size-profile-box-subtitle);

  b {
    color: var(--color-card-text);
    font-weight: var(--font-weight-headings-heavy);
  }
}
</style>
