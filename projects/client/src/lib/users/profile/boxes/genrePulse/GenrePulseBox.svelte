<!-- Genre Pulse: the genre running hot this month against the user's usual, with the month's top three. -->
<script lang="ts">
import BoxChips from '$lib/components/users/profile-box/BoxChips.svelte';
import BoxFigure from '$lib/components/users/profile-box/BoxFigure.svelte';
import ProfileBox from '$lib/components/users/profile-box/ProfileBox.svelte';
import type { GenrePulseView } from './GenrePulseView.ts';

const { view }: { view: GenrePulseView } = $props();
</script>

<ProfileBox tone="genre">
  <BoxChips chips={[{ text: 'Genre Pulse' }, { text: 'This Month', alt: true }]} />
  <BoxFigure value={view.spike} label={[`more ${view.genre}`, 'than usual']} />
  <ul>
    {#each view.rows as row (row.name)}
      <li>
        <span class="name">{row.name}</span>
        <span class="shares">{row.now}% now · {row.usual}% usual</span>
        <span
          class="track"
          role="img"
          aria-label="{row.name}: {row.now}% this month, {row.usual}% all time"
          style:--now="{row.now}%"
          style:--usual="{row.usual}%"
        ></span>
      </li>
    {/each}
  </ul>
</ProfileBox>

<style>
ul {
  margin: 8px 0 0;
  padding: 0;
  list-style: none;
}

li {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 1px 8px;
  margin-block-end: 6px;
  font-size: var(--font-size-small);
}

.shares {
  color: var(--color-profile-ink-soft);
  font-size: var(--font-size-profile-chip);
  font-variant-numeric: tabular-nums;
}

/* This month as the bar, all time as the black tick. */
.track {
  position: relative;
  grid-column: 1 / -1;
  block-size: var(--profile-box-meter-height);
  border-radius: var(--radius-profile-box-mark);
  background: linear-gradient(to right, var(--color-profile-mark) var(--now), var(--color-profile-track) var(--now));

  &::after {
    content: '';
    position: absolute;
    inset-block: -3px;
    inset-inline-start: var(--usual);
    inline-size: var(--profile-box-genre-tick);
    margin-inline-start: calc(var(--profile-box-genre-tick) / -2);
    border-radius: 1px;
    background-color: var(--color-profile-genre-tick);
    box-shadow: var(--shadow-profile-genre-tick);
  }
}
</style>
