<!--
  One stat the way the toolbars draw them: an icon in its meaning color, the number in white and the word in gray.
  With a `label` it's a focus stop with that tooltip; `under` adds a gray second line to the tooltip (the progress strip's
  "133 / 154 episodes"). `tone` picks the icon color: `watched` purple, `collected` the library's
  teal, `done` green, and `count` (the default) blue for counts and times. `bare` leaves the word to the tooltip and
  screen readers, for toolbars, where room is short; rows keep their words.
    <Stat svg={hourglass} value="4d 9h" noun="left" label="Time left to watch" bare />
-->
<script lang="ts">
import Tooltip from '$lib/components/tooltip/Tooltip.svelte';
import Icon from '$lib/icons/Icon.svelte';

interface Props {
  svg: string;
  value: string;
  noun: string;
  /** The tooltip. Left out, the stat is plain text with no focus stop. */
  label?: string;
  under?: string;
  tone?: 'count' | 'watched' | 'collected' | 'done';
  bare?: boolean;
}

const { svg, value, noun, label, under, tone = 'count', bare = false }: Props = $props();
</script>

{#snippet body(props: Record<string | symbol, unknown> = {})}
  <!-- A focus stop so the tooltip shows from the keyboard too. -->
  <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
  <span class={['stat', tone]} tabindex={label ? 0 : undefined} {...props}>
    <span class="icon-slot"><Icon {svg} /></span><span><strong>{value}</strong> <span class={['noun', { 'visually-hidden': bare }]}>{noun}</span></span>
  </span>
{/snippet}

{#if label && under}
  <Tooltip>
    {#snippet trigger(tooltip)}{@render body(tooltip)}{/snippet}
    <span class="tip">{label}<span class="detail">{under}</span></span>
  </Tooltip>
{:else if label}
  <Tooltip text={label}>
    {#snippet trigger(tooltip)}{@render body(tooltip)}{/snippet}
  </Tooltip>
{:else}
  {@render body()}
{/if}

<style>
.stat {
  display: inline-flex;
  align-items: center;
  color: var(--color-stat-noun);
  font-family: var(--font-headings);
  font-size: var(--font-size-stat-noun);
  white-space: nowrap;
}

strong {
  color: var(--color-stat-number);
  font-size: var(--font-size-stat-number);
  font-weight: var(--font-weight-headings-heavy);
}

.icon-slot {
  display: inline-flex;
  margin-inline-end: var(--space-stat);
  color: var(--color-stat-count);
  font-size: var(--font-size-stat-icon);
  line-height: 1;

  .watched & {
    color: var(--color-stat-watched);
  }

  .collected & {
    color: var(--color-stat-collected);
  }

  .done & {
    color: var(--color-progress-episode-done);
  }
}

/* The tooltip with `under`: the label over it in gray, like the watched tooltips. */
.tip {
  display: grid;
}

.detail {
  color: var(--color-tooltip-muted);
}
</style>
