<!--
  A day's Upcoming Schedule rows, one per show: the air time, a small poster, the show with its episodes and network,
  and the premiere or finale tag, which drops under the text in a narrow panel. "Show N more" opens the rest.
-->
<script lang="ts">
import posterPlaceholder from '$lib/assets/placeholders/poster.png';
import type { ScheduleLayout } from '$lib/dashboard/toScheduleLayout';
import ScheduleEpisodes from './ScheduleEpisodes.svelte';
import ScheduleTag from './ScheduleTag.svelte';

const { rows }: { rows: Pick<ScheduleLayout['week'][number], 'shown' | 'more'> } = $props();

let expanded = $state(false);
const shown = $derived(expanded ? [...rows.shown, ...rows.more] : rows.shown);
</script>

<!-- The popular shows page takes a network filter og hasn't built yet; resolve() only takes routes that exist. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->

<ul>
  {#each shown as row (row.key)}
    <li class="row">
      <span class="time">{row.time ?? ''}</span>
      <img class="poster" src={row.poster ?? posterPlaceholder} alt="" loading="lazy" decoding="async" />
      <span class="what">
        <a class="show" href={row.href}>{row.title}</a>
        <ScheduleEpisodes {row} inline>
          {#snippet after()}
            {#if row.network}
              <span class="network">· {#if row.network.href}<a href={row.network.href}>{row.network.name}</a>{:else}{row.network.name}{/if}</span>
            {/if}
          {/snippet}
        </ScheduleEpisodes>
      </span>
      {#if row.label}<span class="tag"><ScheduleTag label={row.label} /></span>{/if}
    </li>
  {/each}
</ul>
{#if rows.more.length > 0}
  <button type="button" class="more" aria-expanded={expanded} onclick={() => (expanded = !expanded)}>
    {expanded ? 'Show fewer' : `Show ${rows.more.length} more`}
  </button>
{/if}

<style>
ul {
  margin: 0;
  padding: 0;
  list-style: none;
}

.row {
  display: grid;
  grid-template-columns: var(--schedule-row-time) var(--schedule-row-poster) minmax(0, 1fr) auto;
  gap: var(--space-schedule-row-gap);
  align-items: center;
  padding: var(--space-schedule-row);
  border-block-start: 1px solid var(--color-schedule-separator);
  font-size: var(--font-size-schedule-row);

  &:hover {
    background-color: var(--color-schedule-row-hover);
  }

  @container (width < 500px) {
    grid-template-columns: var(--schedule-row-time-narrow) var(--schedule-row-poster) minmax(0, 1fr);

    & .tag {
      grid-column: 3;
    }
  }
}

.time,
.network {
  color: var(--color-schedule-muted);
  font-size: var(--font-size-small);
}

.time {
  white-space: nowrap;
}

.poster {
  inline-size: 100%;
  aspect-ratio: 2 / 3;
  object-fit: cover;
}

.what {
  display: flex;
  flex-wrap: wrap;
  column-gap: var(--space-schedule-row-gap);
  align-items: baseline;
  min-inline-size: 0;
}

.show {
  font-family: var(--font-headings);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-headings);
}

.network {
  margin-inline-start: var(--space-schedule-code);

  & a {
    color: inherit;
  }
}

.tag {
  justify-self: end;

  @container (width < 500px) {
    justify-self: start;
  }
}

.more {
  display: block;
  inline-size: 100%;
  padding: var(--space-schedule-more);
  border: 0;
  border-block-start: 1px solid var(--color-schedule-separator);
  background: none;
  color: var(--color-link);
  font-family: var(--font-headings);
  font-size: var(--font-size-small);
  font-weight: var(--font-weight-headings);
  text-align: start;
  text-transform: uppercase;
  cursor: pointer;

  &:hover {
    background-color: var(--color-schedule-row-hover);
  }
}
</style>
