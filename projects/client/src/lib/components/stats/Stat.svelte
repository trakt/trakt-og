<!--
  One stat the way the toolbars draw them: an icon in its meaning color, the number in white and the word in gray.
  With a `label` it's a focus stop with that tooltip; with `under` a smaller line shows under it on hover and focus
  (the progress strip's "133/154 episodes"). `tone` picks the icon color: `watched` purple, `collected` the library's
  teal, `done` green, and `count` (the default) blue for counts and times.
    <Stat svg={clock} value="4d 9h" noun="left" label="Time left to watch" />
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
}

const { svg, value, noun, label, under, tone = 'count' }: Props = $props();
</script>

{#snippet body(props: Record<string | symbol, unknown> = {})}
  <!-- A focus stop so the tooltip and the line under it show from the keyboard too. -->
  <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
  <span class={['stat', tone]} tabindex={label ? 0 : undefined} {...props}>
    <span class="icon-slot"><Icon {svg} /></span><span class="text"><strong>{value}</strong> {noun}{#if under}<span
          class="under"
        >{under}</span>{/if}</span>
  </span>
{/snippet}

{#if label}
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

.text {
  position: relative;
  display: inline-block;
}

.under {
  position: absolute;
  inset-block-end: var(--list-stat-under-offset);
  inset-inline-start: 0;
  color: var(--color-list-stat-under);
  font-size: var(--font-size-list-stat-under);
  opacity: 0;
  transition: opacity 0.5s;

  .stat:is(:hover, :focus-visible) & {
    opacity: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .under {
    transition: none;
  }
}
</style>
