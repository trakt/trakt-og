<!--
  Trending's Live now: everyone watching this chart's type, then a bar of shows against movies over a tag for each,
  linking to its chart. This chart's share and tag are red.
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
  open: boolean;
}

const { live, type, open }: Props = $props();

const TYPES: readonly MediaType[] = ['shows', 'movies'];
const count = (n: number) => n.toLocaleString('en-US');
const watchers = $derived(live[type]);
</script>

<!-- Trending's other type is a built route with no params, so resolve() has nothing to add. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->

<SidebarSection id="live" title="Live now" {open} remember>
  <div class="meter">
    <p class="total"><StatusDot kind="live" /><b>{count(watchers)}</b> watching {type} now</p>
    <div class="split" aria-hidden="true">
      {#each TYPES as each (each)}
        <span class={{ current: each === type }} style:flex-grow={live[each]}></span>
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
