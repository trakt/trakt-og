<!--
  A stat on a toolbar's right (`.comment-wrapper.subnav .interactions`): an icon in its meaning color, the number in
  white and the noun in gray, with a tooltip. `bare` leaves the noun to the tooltip, for rows with more than three
  stats. `tone` picks the icon's color: purple for watched, teal for collected, blue for everything else.
    <SubnavCount svg={fileIcon} count={57} noun="item" tooltip="Items" />
    <SubnavCount svg={check} value="88%" noun="watched" tooltip="Watched" tone="watched" bare />
-->
<script lang="ts">
import Tooltip from '$lib/components/tooltip/Tooltip.svelte';
import Icon from '$lib/icons/Icon.svelte';

interface Props {
  svg: string;
  /** A count, shown with thousands separators and a plural noun. */
  count?: number;
  /** Already formatted ("88%", "4d 1h 3m"); the noun stays as given. */
  value?: string;
  /** Singular; an s is added unless the count is 1. */
  noun: string;
  /** For nouns an s doesn't fit ("people"). */
  plural?: string;
  tooltip: string;
  tone?: 'watched' | 'collected' | 'count';
  bare?: boolean;
}

const { svg, count, value, noun, plural, tooltip, tone = 'count', bare = false }: Props = $props();
const shown = $derived(value ?? (count ?? 0).toLocaleString('en-US'));
const word = $derived(value !== undefined || count === 1 ? noun : (plural ?? `${noun}s`));
</script>

<Tooltip text={tooltip}>
  {#snippet trigger(attributes)}
    <span class={['count', tone]} {...attributes}><Icon {svg} /><strong>{shown}</strong>{#if bare}<span
          class="visually-hidden"
        >{word}</span>{:else}<span class="noun">{word}</span>{/if}</span>
  {/snippet}
</Tooltip>

<style>
.count {
  display: inline-flex;
  gap: var(--space-stat);
  align-items: baseline;
  color: var(--color-stat-noun);
  font-family: var(--font-headings);
  font-size: var(--font-size-stat-noun);
  white-space: nowrap;

  & :global(.icon) {
    align-self: center;
    color: var(--color-stat-count);
    font-size: var(--font-size-stat-icon);
  }

  &.watched :global(.icon) {
    color: var(--color-stat-watched);
  }

  &.collected :global(.icon) {
    color: var(--color-stat-collected);
  }
}

strong {
  color: var(--color-stat-number);
  font-size: var(--font-size-stat-number);
  font-weight: var(--font-weight-headings-heavy);
}

.visually-hidden {
  position: absolute;
  inline-size: 1px;
  block-size: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}
</style>
