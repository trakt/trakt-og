<!--
  Trending's Live now: everyone watching this chart's type, then a bar of shows against movies over a tag for each,
  linking to its chart. This chart's share and tag are red. Filtered, it counts only the titles the filters leave,
  and the bar is their share of everyone watching this type; the tags still link to each whole chart.
-->
<script lang="ts">
import SidebarSection from '$lib/components/sidebar/SidebarSection.svelte';
import TagPills from '$lib/components/labels/TagPills.svelte';
import StatusDot from '$lib/components/status/StatusDot.svelte';
import { compactCount } from '$lib/utils/compactCount';
import type { LiveNow } from './fetchLiveNow';
import type { MediaType } from './loadChart';

interface Props {
  live: LiveNow;
  type: MediaType;
  /** Everyone watching the filtered chart's titles. Left out unfiltered. */
  filtered?: number | null;
  open: boolean;
}

const { live, type, filtered, open }: Props = $props();

const TYPES: readonly MediaType[] = ['shows', 'movies'];
const count = (n: number) => n.toLocaleString('en-US');
const narrowed = $derived(typeof filtered === 'number');
const watchers = $derived(filtered ?? live[type]);
// Filtered, the bar is these titles against the rest of the type. Live now is kept for a few minutes, so the
// filtered count can run past it; the rest never goes below nothing.
const bar = $derived(
  narrowed
    ? [
        { key: 'filtered', share: watchers, current: true },
        { key: 'rest', share: Math.max(live[type] - watchers, 0), current: false },
      ]
    : TYPES.map((each) => ({ key: each, share: live[each], current: each === type })),
);
</script>

<!-- Trending's other type is a built route with no params, so resolve() has nothing to add. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->

<SidebarSection id="live" title="Live now" {open} remember>
  <div class="meter">
    <p class="total"><StatusDot kind="live" /><b>{count(watchers)}</b> watching {narrowed ? 'these ' : ''}{type} now</p>
    <div class="split" aria-hidden="true">
      {#each bar as part (part.key)}
        <span class={{ current: part.current }} style:flex-grow={part.share}></span>
      {/each}
    </div>
  </div>
  <p class="key">
    {#each TYPES as each (each)}
      <a href="/{each}/trending" aria-current={each === type ? 'page' : undefined}>
        <TagPills tags={[{ lead: compactCount(live[each]), text: each, kind: each === type ? 'primary' : undefined }]} />
      </a>
    {/each}
  </p>
</SidebarSection>

<style>
.meter {
  display: grid;
  gap: var(--live-now-meter-gap);
  margin-block-start: var(--live-now-meter-top);
}

.total {
  display: flex;
  gap: var(--space-sm-inline);
  align-items: baseline;
  margin: 0;
  color: var(--color-sidebar-note);
  font-size: var(--font-size-control);
  line-height: 1;

  & :global(.dot) {
    align-self: center;
  }

  & b {
    color: var(--color-frame-ink);
    font-family: var(--font-box-office-figures);
    font-stretch: condensed;
    font-size: var(--font-size-live-now);
    font-weight: var(--font-weight-headings-heavy);
    line-height: 1;
    font-variant-numeric: tabular-nums;
  }
}

.split {
  display: flex;
  gap: var(--live-now-split-gap);
  block-size: var(--live-now-split-height);
  border-radius: var(--radius-progress-bar);
  overflow: hidden;

  & span {
    flex-basis: 0;
    background-color: var(--color-live-now-other);
  }

  & .current {
    background-color: var(--brand-primary);
  }
}

.key {
  display: flex;
  justify-content: space-between;
  margin: 0;

  & a {
    border-radius: var(--radius-search-pill);
    text-decoration: none;

    &:is(:hover, :focus-visible) {
      opacity: var(--opacity-live-now-key-hover);
    }
  }
}
</style>
