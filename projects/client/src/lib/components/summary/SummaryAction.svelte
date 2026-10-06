<!--
  A button in the action stack beside a summary's overview: history, library, lists, favorites, comments, check in.
  Not added, it's one outlined button in its color, with its side tiles inside the outline. Added (`selected`), it
  fills with its color and the tiles split off beside it. Every button is the same height.
    <SummaryAction color="var(--brand-quaternary)" icon={collection} percent="95%" text="in library" selected
      onclick={open}>
      {#snippet detail()}177/186 episodes{/snippet}
      {#snippet tiles()}<SummaryActionTile icon={plus} label="Add to library" onclick={add} />{/snippet}
    </SummaryAction>
  `href` makes it a link, `readonly` a plain box (a person's credit progress). `busy` is the spinner's label while
  something saves. `aside` sits at the button's right edge (library format logos), and `tooltip` shows under it.
  The other props land on the button itself.
-->
<script lang="ts">
import type { Snippet } from 'svelte';
import type { HTMLAttributes } from 'svelte/elements';
import Icon from '$lib/icons/Icon.svelte';
import Spinner from '$lib/components/loading/Spinner.svelte';
import Tooltip from '$lib/components/tooltip/Tooltip.svelte';

interface Props extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  color: string;
  icon: string;
  /** The uppercase line. */
  text: string;
  /** Set larger before `text` ("95%" in library). */
  percent?: string;
  /** The smaller line under it. */
  detail?: Snippet | string;
  selected?: boolean;
  busy?: string;
  href?: string;
  readonly?: boolean;
  disabled?: boolean;
  element?: HTMLElement;
  tiles?: Snippet;
  aside?: Snippet;
  tooltip?: string;
}

let {
  color,
  icon,
  text,
  percent,
  detail,
  selected = false,
  busy,
  href,
  readonly = false,
  disabled,
  element = $bindable(),
  tiles,
  aside,
  tooltip,
  ...rest
}: Props = $props();

const tag = $derived(href ? 'a' : readonly ? 'div' : 'button');
</script>

<div class={['summary-action', { selected }]} style:--action-color={color}>
  <Tooltip text={tooltip} placement="bottom">
    {#snippet trigger(tip)}
      <svelte:element this={tag} bind:this={element} class="main" {href} type={tag === 'button' ? 'button' : undefined}
        disabled={tag === 'button' ? disabled : undefined} {...rest} {...tip}>
        <span class="icon"><Icon svg={icon} /></span>
        <span class="text">
          <span class="title">{#if percent}<b class="percent">{percent}</b>&nbsp;{/if}{text}</span>
          {#if typeof detail === 'string'}<span class="detail">{detail}</span>{:else if detail}<span class="detail">{@render detail()}</span>{/if}
        </span>
        {#if aside}<span class="aside">{@render aside()}</span>{/if}
      </svelte:element>
    {/snippet}
  </Tooltip>
  {#if tiles}<div class="tiles">{@render tiles()}</div>{/if}
  {#if busy}<span class="busy"><Spinner label={busy} /></span>{/if}
</div>

<style>
.summary-action {
  /* The tiles read these, so they follow the button's state. */
  --tile-bg: none;
  --tile-color: inherit;
  --tile-hover-bg: color-mix(in srgb, var(--action-color) var(--summary-action-tile-hover-tint), transparent);
  --tile-hover-filter: none;
  --tile-inset: var(--summary-action-tile-inset);
  position: relative;
  display: flex;
  inline-size: 100%;
  block-size: var(--summary-action-height);
  border-radius: var(--radius-summary-action);
  background: color-mix(in srgb, var(--action-color) var(--summary-action-tint), var(--color-action-bg));
  box-shadow: inset 0 0 0 var(--summary-action-outline)
    color-mix(in srgb, var(--action-color) var(--summary-action-outline-mix), transparent);
  color: var(--action-color);
  transition: gap var(--transition-summary-action), background-color var(--transition-summary-action),
    color var(--transition-summary-action);

  &:not(.selected):has(> .main:is(:hover, :focus-visible):not(div)) {
    background: var(--action-color);
    box-shadow: none;
    color: var(--color-text-inverse);
    --tile-hover-bg: var(--color-action-side-bg-hover);
  }

  &.selected {
    --tile-bg: color-mix(in srgb, var(--action-color) var(--summary-action-tile-shade), var(--color-summary-action-tile-shade));
    --tile-color: var(--color-text-inverse);
    --tile-hover-bg: var(--action-color);
    --tile-hover-filter: var(--summary-action-hover);
    --tile-inset: 0;
    gap: var(--summary-action-gap);
    background: none;
    box-shadow: none;
    color: var(--color-text-inverse);
  }
}

.main {
  flex: 1;
  display: flex;
  align-items: center;
  min-inline-size: 0;
  min-block-size: 0;
  padding: 0;
  border: 0;
  border-radius: var(--radius-summary-action);
  background: none;
  color: inherit;
  font: inherit;
  text-align: start;
  text-decoration: none;
  cursor: pointer;

  .selected & {
    background: var(--action-color);
    transition: filter var(--transition-summary-action);
  }

  .selected &:is(:hover, :focus-visible):not(div, [aria-disabled='true']) {
    filter: var(--summary-action-hover);
  }

  &:focus-visible {
    outline: var(--watch-focus) solid var(--color-input-border-focus);
    outline-offset: calc(-1 * var(--watch-focus));
  }

  &:is(div, [disabled], [aria-disabled='true']) {
    cursor: default;
  }
}

/* Centered on the box, not the text baseline the icon sits on elsewhere. */
.icon {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  align-self: stretch;
  inline-size: var(--action-icon-width);
  font-size: var(--summary-action-icon-size);
}

.aside {
  display: grid;
  place-items: center end;
  flex-shrink: 0;
  padding-inline: var(--summary-action-aside-gap);
}

.text {
  flex: 1;
  min-inline-size: 0;
  font-family: var(--font-headings);
}

.title,
.detail {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.title {
  font-size: var(--font-size-action);
  font-weight: var(--font-weight-headings-heavy);
  letter-spacing: var(--summary-action-tracking);
  line-height: var(--summary-action-title-line);
  text-transform: uppercase;
}

.percent {
  font-size: var(--font-size-summary-action-percent);
  font-variant-numeric: tabular-nums;
  letter-spacing: 0;
}

.detail {
  font-size: var(--font-size-small);
  line-height: var(--summary-action-detail-line);
}

.tiles {
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  gap: var(--summary-action-gap);
  inline-size: var(--summary-action-tile-width);
  transition: inline-size var(--transition-summary-action);
}

.busy {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  border-radius: var(--radius-summary-action);
  background: var(--color-action-bg);
  color: var(--action-color);
  font-size: var(--font-size-action-icon);
}

@media (prefers-reduced-motion: reduce) {
  .summary-action,
  .tiles {
    transition: none;
  }
}
</style>
