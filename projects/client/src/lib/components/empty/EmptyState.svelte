<!--
  The empty state: a dashed, rounded outline that reads as a gap, not a row, with OG's "Nothing to see here. Move
  along, move along." and at most one way out under it, as og's outline button: where to start, a Clear for what hid
  it, or Try again. See `.agents/rules/design-system.md`.
  `title` replaces the line where it would read wrong (LoadFailed's "Up Next didn't load.", a calendar's empty day);
  `inFrame` is the version on the dark charts and search frames; `failed` is LoadFailed's warning outline, so use
  LoadFailed instead of setting it.
    <EmptyState action={{ href: resolve('/shows/[chart=chart]', { chart: 'trending' }), text: 'Find a show' }} />
-->
<script lang="ts">
import LinkButton from '$lib/components/button/LinkButton.svelte';
import type { EmptyAction } from './EmptyAction.ts';

interface Props {
  title?: string;
  action?: EmptyAction;
  inFrame?: boolean;
  failed?: boolean;
}

const { title = 'Nothing to see here. Move along, move along.', action, inFrame = false, failed = false }: Props =
  $props();
</script>

<div class={['empty-state', { 'in-frame': inFrame, failed }]}>
  <p>{title}</p>
  {#if action && 'href' in action}
    <LinkButton href={action.href} variant="outline">{action.text}</LinkButton>
  {:else if action}
    <LinkButton onclick={action.onclick} disabled={action.busy} variant="outline">{action.text}</LinkButton>
  {/if}
</div>

<style>
.empty-state {
  display: grid;
  justify-items: center;
  gap: var(--empty-state-gap);
  margin-block-end: var(--line-height-computed);
  padding: var(--empty-state-padding);
  border: 1px dashed var(--color-empty-state-border);
  border-radius: var(--radius-empty-state);
  color: var(--color-empty-state-text);
  font-family: var(--font-headings);
  text-align: center;

  &.in-frame {
    margin-block-end: 0;
    border-color: var(--color-empty-state-frame-border);
    color: var(--color-frame-muted);
  }

  &.failed {
    border-color: var(--color-empty-state-failed-border);
  }
}

p {
  margin: 0;
  font-size: var(--font-size-empty-state);
  font-style: italic;
  text-wrap: balance;
}
</style>
