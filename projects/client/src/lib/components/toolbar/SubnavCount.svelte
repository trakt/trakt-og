<!--
  A stat on a toolbar's right (`.comment-wrapper.subnav .interactions`): an icon in its meaning color and the number in
  white, with a tooltip. The noun is left to the tooltip and screen readers, as on a list's stats bar, so the toolbar
  keeps its room. `tone` picks the icon's color: purple for watched, teal for collected, blue for everything else.
    <SubnavCount svg={fileIcon} count={57} noun="item" tooltip="Items" />
    <SubnavCount svg={check} value="88%" noun="watched" tooltip="Watched" tone="watched" />
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
}

const { svg, count, value, noun, plural, tooltip, tone = 'count' }: Props = $props();
const shown = $derived(value ?? (count ?? 0).toLocaleString('en-US'));
const word = $derived(value !== undefined || count === 1 ? noun : (plural ?? `${noun}s`));
</script>

<Tooltip text={tooltip}>
  {#snippet trigger(attributes)}
    <span class={['count', tone]} {...attributes}><Icon {svg} /><strong>{shown}</strong><span class="visually-hidden"
      >{word}</span></span>
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
</style>
