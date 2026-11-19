<!--
  Top List: the user's most liked list over its first item's fanart, a fanned stack of its posters, its name, and its
  items, likes and comments in the band as the stats bar's icons and numbers, each with its words as a tooltip.
-->
<script lang="ts">
import Stat from '#lib/components/stats/Stat.svelte';
import { stripStatIcons } from '#lib/components/summary/stripStatIcons.ts';
import BoxPosterFan from '#lib/components/users/profile-box/BoxPosterFan.svelte';
import BoxTitle from '#lib/components/users/profile-box/BoxTitle.svelte';
import ProfileBox from '#lib/components/users/profile-box/ProfileBox.svelte';
import postersIcon from '#lib/icons/regular/rectangle-vertical-history.svg?raw';
import voteYes from '#lib/icons/regular/thumbs-up.svg?raw';
import type { TopListView } from './TopListView.ts';

const { view }: { view: TopListView } = $props();
/** A number with its word for screen readers, and the stat's name for its tooltip. */
const count = (value: number, word: string, label: string) =>
  ({ value: value.toLocaleString('en-US'), noun: value === 1 ? word : `${word}s`, label, bare: true }) as const;
</script>

{#snippet foot()}
  <p class="counts">
    <Stat svg={postersIcon} {...count(view.counts.items, 'item', 'Items')} />
    <Stat svg={voteYes} {...count(view.counts.likes, 'like', 'Likes')} />
    <Stat svg={stripStatIcons.comments} {...count(view.counts.comments, 'comment', 'Comments')} />
  </p>
{/snippet}

<ProfileBox label="Top List" image={view.image ?? null} {foot}>
  <BoxPosterFan posters={view.posters} />
  <BoxTitle title={view.title} />
</ProfileBox>

<style>
.counts {
  --font-size-stat-number: var(--font-size-profile-box-stat);
  --font-size-stat-icon: var(--font-size-profile-box-stat);
  display: flex;
  gap: var(--profile-box-stats-gap);
  margin: 0;
}
</style>
