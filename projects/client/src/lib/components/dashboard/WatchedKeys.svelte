<!--
  The Last 30 Days keys over the minutes chart: time watched, episodes, movies and the best week, in the genre
  keys' style. The episode and movie keys take their bars' colors for the rule over them, so they double as the
  chart's legend.
-->
<script lang="ts">
import type { LastThirtyDays } from '$lib/dashboard/LastThirtyDays';

const { keys }: { keys: LastThirtyDays['keys'] } = $props();
</script>

<div class="watched-keys">
  <ul class="keys">
  {#each keys as key (key.name)}
    <li class="key" style:--color={key.type ? `var(--color-minutes-${key.type})` : undefined}>
      <span class="name">{key.name}</span>
      <span class="share">{key.share}</span>
      <span class="counts">
        {#each key.counts as count, i (count)}{#if i > 0}<span class="separator" aria-hidden="true">·</span>{/if}<span
          >{count}</span>{/each}
      </span>
    </li>
  {/each}
  </ul>
</div>

<style>
.watched-keys {
  container-type: inline-size;
}

.keys {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--space-genre-keys-row) var(--space-genre-keys-column);
  margin: 0;
  padding: 0;
  list-style: none;
}

.key {
  min-inline-size: 0;
  padding-block-start: var(--space-genre-key-top);
  border-block-start: var(--genre-key-rule) solid var(--color, var(--color-genre-other));
}

.name {
  display: block;
  overflow: hidden;
  color: var(--color-genre-label);
  font-family: var(--font-headings);
  font-size: var(--font-size-genre-label);
  font-weight: var(--font-weight-headings);
  text-overflow: ellipsis;
  text-transform: uppercase;
  white-space: nowrap;
}

.share {
  display: block;
  color: var(--color-genre-label);
  font-family: var(--font-headings);
  font-size: var(--font-size-genre-share);
  font-weight: var(--font-weight-headings-heavy);
  line-height: var(--line-height-genre-share);
}

.counts {
  display: block;
  color: var(--color-genre-count);
  font-size: var(--font-size-genre-key-count);
}

.separator {
  margin-inline: var(--space-genre-separator);
}

/* Narrow: two keys a row. */
@container (width < 600px) {
  .keys {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
