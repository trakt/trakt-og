<!--
  What a related pick shares with the summary's title, under its poster: a strip with one block per topic in the
  band's chips, in their order, lit where the pick shares it (red for people), then "4 of 9 topics". Hovering a block
  names its topic (grayed when not shared), or the people the pick shares. The picked chip's block is outlined in every strip.
    <RelatedFingerprint {pick} {threads} title="Breaking Bad" filter="outlaw" />
-->
<script lang="ts">
import { fitLines } from '#lib/components/tooltip/fitLines.ts';
import Tooltip from '#lib/components/tooltip/Tooltip.svelte';
import type { RelatedPick } from '#lib/summary/RelatedPick.ts';
import type { RelatedThread } from '#lib/summary/RelatedThread.ts';
import { relatedPeopleNames } from '#lib/summary/relatedPeopleNames.ts';

interface Props {
  pick: RelatedPick;
  threads: readonly RelatedThread[];
  /** The summary's title, for screen readers. */
  title: string;
  /** The thread picked in the band's chips. */
  filter?: string;
}

const { pick, threads, title, filter }: Props = $props();
const names = $derived(relatedPeopleNames(pick.people));
const shared = $derived(threads.filter(({ id }) => pick.threads.includes(id)));
const topics = $derived(threads.length === 1 ? 'topic' : 'topics');
const label = $derived(
  `Shares ${shared.length} of ${threads.length} ${topics} with ${title}${
    shared.length > 0
      ? `: ${shared.map((thread) => (thread.people && names ? `${thread.label} (${names})` : thread.label)).join(', ')}`
      : ''
  }`,
);
</script>

<div class="fingerprint">
  <span class="strip" role="img" aria-label={label} style:--threads={threads.length}>
    {#each threads as thread (thread.id)}
      {@const on = pick.threads.includes(thread.id)}
      <Tooltip>
        {#snippet trigger(tooltip)}
          <span class={['block', { on, people: thread.people, focus: thread.id === filter }]} {...tooltip}></span>
        {/snippet}
        {#if on && thread.people && names}
          <span class="names" {@attach fitLines}>{names}</span>
        {:else if on}
          {thread.label}
        {:else}
          <span class="muted">{thread.label}</span>
        {/if}
      </Tooltip>
    {/each}
  </span>
  <span class="note" aria-hidden="true"><b>{shared.length}</b> of {threads.length} {topics}</span>
</div>

<style>
.fingerprint {
  display: grid;
  gap: var(--space-related-fingerprint);
  margin-block-start: var(--space-related-fingerprint);
}

.strip {
  display: grid;
  grid-template-columns: repeat(var(--threads), minmax(0, 1fr));
  gap: var(--related-fingerprint-gap);
  block-size: var(--related-fingerprint-height);
}

.block {
  position: relative;
  border-radius: var(--radius-related-fingerprint);
  background-color: var(--color-related-fingerprint-off);

  /* The blocks are thin, so each one's hover reaches past it, across half the gap on either side. */
  &::before {
    content: '';
    position: absolute;
    inset-block: calc(-1 * var(--related-fingerprint-hit));
    inset-inline: calc(var(--related-fingerprint-gap) / -2);
  }

  &.on {
    background-color: var(--color-related-fingerprint-on);
  }

  &.on.people {
    background-color: var(--color-related-fingerprint-people);
  }

  &.focus {
    outline: var(--related-fingerprint-ring) solid var(--color-related-fingerprint-focus);
    outline-offset: var(--related-fingerprint-ring);
  }

  &.on.focus:not(.people) {
    background-color: var(--color-related-fingerprint-focus);
  }
}

.names {
  display: inline-block;
}

.muted {
  color: var(--color-tooltip-muted);
}

.note {
  overflow: hidden;
  color: var(--color-related-note);
  font-size: var(--font-size-related-note);
  font-variant-numeric: tabular-nums;
  text-overflow: ellipsis;
  white-space: nowrap;

  & b {
    color: var(--color-related-text);
    font-weight: var(--font-weight-headings);
  }
}
</style>
