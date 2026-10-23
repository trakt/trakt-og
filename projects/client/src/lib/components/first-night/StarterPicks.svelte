<!--
  A row of starter picks from a public chart, loaded in the browser once the panel shows it's empty. `type: 'both'`
  deals shows and movies alternately. Nothing renders if the chart fails.
-->
<script lang="ts">
import {
  fetchStarterPicks,
  interleave,
  type PickAction,
  type StarterChart,
  type StarterPick,
  type StarterType,
} from '$lib/firstNight/starterPicks';
import PickPoster from './PickPoster.svelte';

interface Props {
  chart: StarterChart;
  type: StarterType | 'both';
  count: number;
  columns?: number;
  /** The one thing these picks ask for. */
  action: PickAction;
}

const { chart, type, count, columns = count, action }: Props = $props();

async function load(): Promise<StarterPick[]> {
  const fetchType = (of: StarterType) => fetchStarterPicks({ fetch, chart, type: of, limit: count });
  if (type !== 'both') return fetchType(type);
  const [shows, movies] = await Promise.all([fetchType('shows'), fetchType('movies')]);
  return interleave(shows, movies).slice(0, count);
}

const picks = $derived(load());
</script>

{#await picks then list}
  {#if list.length > 0}
    <div class="frame">
  <div class="grid" style:--columns={columns}>
        {#each list as pick (pick.key)}
          <PickPoster {pick} {action} />
        {/each}
      </div>
</div>
  {/if}
{/await}

<style>
.frame {
  container-type: inline-size;
}

/* One row beside the quote; two columns when the panel is narrow. */
.grid {
  display: grid;
  grid-template-columns: repeat(var(--columns), minmax(0, 1fr));
  gap: var(--gutter);

  @container (width < 480px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
