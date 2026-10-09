<!--
  A count in a SidebarFrame's sidebar: "197 episodes". With `total` (the page is filtered) it turns red and reads
  "125 of 197 episodes", so a filtered page is obvious at a glance.
    <CountPill count={125} total={197} label="episodes" />
-->
<script lang="ts">
interface Props {
  count: number;
  /** Out of how many, while filtered. */
  total?: number;
  /** The plural noun; `one` is used for a single item. */
  label: string;
  one: string;
}

const { count, total, label, one }: Props = $props();
const filtered = $derived(total !== undefined);
const noun = $derived((filtered ? total : count) === 1 ? one : label);
const format = (value: number) => value.toLocaleString('en-US');
</script>

<span class={['count-pill', { filtered }]}>
  <b>{format(count)}</b>{#if filtered}&nbsp;of {format(total ?? 0)}{/if}&nbsp;{noun}
</span>

<style>
.count-pill {
  display: inline-flex;
  align-items: center;
  block-size: var(--sidebar-pill-height);
  padding: 0 var(--space-base-inline);
  border: 1px solid var(--color-sidebar-pill-border);
  border-radius: var(--radius-sidebar-pill);
  background-color: var(--color-sidebar-pill-bg);
  color: var(--color-sidebar-pill-text);
  font-size: var(--font-size-small);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;

  & b {
    color: var(--color-frame-text);
    font-weight: var(--font-weight-headings-heavy);
  }

  &.filtered {
    border-color: var(--color-sidebar-pill-set-border);
    background-color: var(--color-sidebar-pill-set-bg);
    color: var(--color-sidebar-pill-set-text);
  }
}
</style>
