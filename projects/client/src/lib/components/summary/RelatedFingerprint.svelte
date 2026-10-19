<!--
  What a related pick shares with the summary's title, under its poster: a strip with one block per thread in the
  band's chips, in their order, lit where the pick shares it (red for people), then "4 of 9 · Bob Odenkirk +8". The
  picked chip's block is outlined in every strip.
    <RelatedFingerprint {pick} {threads} title="Breaking Bad" filter="outlaw" />
-->
<script lang="ts">
import type { RelatedPick } from '$lib/summary/RelatedPick';
import type { RelatedThread } from '$lib/summary/RelatedThread';
import { relatedPickNote } from '$lib/summary/relatedPickNote';

interface Props {
  pick: RelatedPick;
  threads: readonly RelatedThread[];
  /** The summary's title, for screen readers. */
  title: string;
  /** The thread picked in the band's chips. */
  filter?: string;
}

const { pick, threads, title, filter }: Props = $props();
const note = $derived(relatedPickNote({ pick, threads, filter }));
const shared = $derived(threads.filter(({ id }) => pick.threads.includes(id)).map(({ label }) => label));
const label = $derived(
  `Shares ${note.shared} of ${note.total} with ${title}${shared.length > 0 ? `: ${shared.join(', ')}` : ''}`,
);
</script>

<div class="fingerprint">
  <span class="strip" role="img" aria-label={label} style:--threads={threads.length}>
    {#each threads as thread (thread.id)}
      <span class={['block', { on: pick.threads.includes(thread.id), people: thread.people, focus: thread.id === filter }]}
      ></span>
    {/each}
  </span>
  <span class="note"
    aria-hidden="true"><b>{note.shared}</b> of {note.total}{note.detail ? ` · ${note.detail}` : ''}</span>
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
  border-radius: var(--radius-related-fingerprint);
  background-color: var(--color-related-fingerprint-off);

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
