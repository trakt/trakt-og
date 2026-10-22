<!--
  The reaction summary beside a comment's React button: one segmented pill with the three biggest reaction kinds and
  their counts, then a "+N" segment when more kinds have any, or "⋯" when they all show. The viewer's own kind is tinted blue. Signed in, each
  emoji is a button that adds that reaction, switches the viewer's to it, or takes it back when it's already theirs,
  as in the picker; signed out the pill only shows the counts. "+N" opens the breakdown, a panel like Why this?: the
  total over every kind, most first, each its emoji, its share as a bar and its count (named for screen readers), the
  viewer's tinted blue, each named in a tooltip beside its emoji, where a signed-in viewer reacts or takes their
  reaction back. Native popovers provide Escape and light dismiss.
  Screen readers hear "including yours" on the viewer's own kind.
-->
<script lang="ts">
import Icon from '$lib/icons/Icon.svelte';
import smile from '$lib/icons/solid/face-smile-plus.svg?raw';
import ellipsis from '$lib/icons/regular/ellipsis.svg?raw';
import xmark from '$lib/icons/regular/xmark.svg?raw';
import { reactionPickLabel } from './reactionPickLabel.ts';
import type { ReactionCount, ReactionSummary } from './reactionSummary.ts';
import type { ReactionType } from './ReactionType.ts';

interface Props {
  summary: ReactionSummary;
  /** The viewer's own reaction. */
  mine?: ReactionType;
  busy?: boolean;
  /** Before a reaction is sent from the breakdown; false stops it. */
  onready?: () => Promise<boolean>;
  /** Left out (signed out), the breakdown only shows the counts. */
  onselect?: (type: ReactionType) => void;
}

const { summary, mine, busy = false, onready, onselect }: Props = $props();
const id = $props.id();
let more = $state<HTMLButtonElement>();
let popover = $state<HTMLDivElement>();
let expanded = $state(false);

// Most first; equal counts keep OG's order, and kinds nobody picked come last.
const ranked = $derived(summary.all.toSorted((a, b) => b.count - a.count));
const total = $derived(summary.all.reduce((sum, { count }) => sum + count, 0));
const share = (count: number) => (total > 0 ? `${(count / total) * 100}%` : '0%');

const named = (reaction: ReactionCount) => reaction.type === mine ? `${reaction.name}, including yours` : reaction.name;

function toggle(event: ToggleEvent) {
  expanded = event.newState === 'open';
  if (expanded) {
    (popover?.querySelector<HTMLButtonElement>('[aria-pressed="true"]') ??
      popover?.querySelector<HTMLButtonElement>('.choice'))?.focus();
  } else {
    more?.focus({ preventScroll: true });
  }
}

async function choose(type: ReactionType) {
  if (busy) return;
  popover?.hidePopover();
  if (onready && !(await onready())) return;
  onselect?.(type);
}
</script>

<div class="reactions">
  <ul class="top" aria-label={summary.total}>
    {#each summary.top as reaction (reaction.type)}
      <li class={['chip', { mine: reaction.type === mine, picks: onselect }]}>
        {#if onselect}
          <button
            type="button"
            class="pick"
            aria-label={reactionPickLabel(reaction, mine)}
            aria-pressed={reaction.type === mine}
            aria-disabled={busy}
            onclick={() => choose(reaction.type)}
          >
            <span class="emoji" aria-hidden="true">{reaction.emoji}</span>{reaction.text}
          </button>
        {:else}
          <span class="emoji" aria-hidden="true">{reaction.emoji}</span>
          <span aria-hidden="true">{reaction.text}</span>
          <span class="visually-hidden">{named(reaction)}</span>
        {/if}
      </li>
    {/each}
  </ul>
  <!-- "+N" when more kinds have reactions, "⋯" when the pill shows them all: either opens the breakdown. -->
  <button
    bind:this={more}
    type="button"
    class="more"
    style:anchor-name="--reactions-{id}"
    aria-label={summary.more > 0 ? `${summary.more} more, show all reactions` : 'Show all reactions'}
    aria-controls="reactions-{id}"
    aria-haspopup="dialog"
    aria-expanded={expanded}
    onclick={() => popover?.togglePopover()}
  >
    {#if summary.more > 0}+{summary.more}{:else}<Icon svg={ellipsis} />{/if}
  </button>
  <div
    bind:this={popover}
    id="reactions-{id}"
    class="breakdown"
    role="dialog"
    aria-label="All reactions"
    popover="auto"
    style:position-anchor="--reactions-{id}"
    ontoggle={toggle}
  >
    <header>
      <div>
        <span class="eyebrow"><Icon svg={smile} />Reactions</span>
        <h4>{summary.total}</h4>
      </div>
      <button type="button" class="close" aria-label="Close" onclick={() => popover?.hidePopover()}>
        <Icon svg={xmark} />
      </button>
    </header>
    <ul class="rows">
      {#each ranked as reaction (reaction.type)}
        {@const row = { zero: reaction.count === 0, yours: reaction.type === mine }}
        {#snippet line()}
          <span class="lead" aria-hidden="true">
            <span class="big-emoji">{reaction.emoji}</span><span class="tip">{reaction.label}</span>
          </span>
          <span class="share" aria-hidden="true"><span style:inline-size={share(reaction.count)}></span></span>
          <span class="count">{reaction.count.toLocaleString('en-US')}</span>
        {/snippet}
        <li>
          {#if onselect}
            <button
              type="button"
              class={['row', 'choice', row]}
              aria-label={reactionPickLabel(reaction, mine)}
              aria-pressed={reaction.type === mine}
              aria-disabled={busy}
              onclick={() => choose(reaction.type)}
            >
              {@render line()}
            </button>
          {:else}
            <span class={['row', row]} role="img" aria-label={named(reaction)}>{@render line()}</span>
          {/if}
        </li>
      {/each}
    </ul>
    <p class="foot">
      {onselect ? 'Pick one to react, or yours again to take it back.' : 'Sign in to add your reaction.'}
    </p>
  </div>
</div>

<style>
/* One pill, as tall as the React button beside it, its segments split by hairlines. */
.reactions {
  display: inline-flex;
  align-items: stretch;
  block-size: var(--control-height);
  overflow: hidden;
  border: 1px solid var(--color-control-border);
  border-radius: var(--radius-control);
  background-color: var(--color-control-bg);
  font-variant-numeric: tabular-nums;
}

.top {
  display: inline-flex;
  align-items: stretch;
  margin: 0;
  padding: 0;
  list-style: none;
}

.chip,
.more {
  display: inline-flex;
  align-items: center;
  padding: var(--comment-reaction-segment-padding);
  font-family: var(--font-headings);
  font-size: var(--font-size-comment-reaction-chip);
  font-weight: var(--font-weight-headings-heavy);

  & + & {
    border-inline-start: 1px solid var(--color-control-border);
  }
}

.top + .more {
  border-inline-start: 1px solid var(--color-control-border);
}

.chip {
  gap: var(--comment-reaction-count-gap);
  color: var(--color-text);
  cursor: default;
}

.mine {
  background-color: var(--color-comment-reaction-mine);
  color: var(--color-comment-reaction-mine-text);
}

/* Signed in, the whole segment is the button, its hover filling it edge to edge. */
.picks {
  align-items: stretch;
  padding: 0;
}

.pick {
  display: inline-flex;
  align-items: center;
  gap: var(--comment-reaction-count-gap);
  min-block-size: 0;
  padding: var(--comment-reaction-segment-padding);
  border: 0;
  border-radius: 0;
  background: none;
  color: inherit;
  font: inherit;
  cursor: pointer;
  transition: background-color var(--transition-comment-quiet);

  &:hover {
    background-color: var(--color-control-hover-bg);
  }

  .mine > &:hover {
    background-color: var(--color-comment-reaction-mine-hover);
  }

  &:focus-visible {
    outline: 2px solid var(--color-link);
    outline-offset: -2px;
  }

  &[aria-disabled='true'] {
    cursor: wait;
  }
}

.emoji {
  font-size: var(--font-size-comment-reaction-emoji);
  line-height: 1;
  translate: 0 var(--comment-reaction-emoji-shift);
}

.more {
  min-block-size: 0;
  border: 0;
  border-radius: 0;
  background: none;
  color: var(--color-comment-muted);
  cursor: pointer;
  transition: background-color var(--transition-comment-quiet), color var(--transition-comment-quiet);

  &:hover,
  &[aria-expanded='true'] {
    background-color: var(--color-comment-chip);
    color: var(--color-text);
  }
}

/* Centred above the "+N", pointing down at it: a panel like Why this?. */
.breakdown {
  position: fixed;
  position-area: top;
  position-try-fallbacks: none;
  inset: auto;
  inline-size: var(--reaction-panel-width);
  max-inline-size: calc(100vw - var(--gutter));
  margin: 0 0 var(--why-arrow-offset);
  padding: 0;
  overflow: visible;
  border: 1px solid var(--color-why-border);
  border-radius: var(--radius-why-panel);
  background: var(--color-why-panel-bg);
  box-shadow: var(--shadow-why-panel);
  color: var(--color-why-text);
  font-family: var(--font-body);
  font-size: var(--font-size-menu);
  text-align: start;
  text-transform: none;

  &:popover-open {
    display: grid;
  }

  /* The arrow, centered under the panel, pointing down at the button, like Why this?'s. */
  &::after {
    content: '';
    position: absolute;
    inset-block-start: 100%;
    inset-inline-start: 50%;
    inline-size: var(--why-arrow);
    block-size: var(--why-arrow);
    border-inline-end: 1px solid var(--color-why-border);
    border-block-end: 1px solid var(--color-why-border);
    background: var(--color-why-panel-bg);
    translate: -50% -50%;
    rotate: 45deg;
  }
}

header {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: var(--space-why-row);
  padding: var(--why-panel-padding);
  border-block-end: 1px solid var(--color-why-border);
  border-start-start-radius: inherit;
  border-start-end-radius: inherit;
  background: var(--gradient-reaction-header);
}

.eyebrow {
  display: inline-flex;
  align-items: center;
  gap: var(--why-stars-gap);
  color: var(--color-reaction-mark);
  font-family: var(--font-headings);
  font-size: var(--font-size-recommendations-side-head);
  font-weight: var(--font-weight-headings-heavy);
  letter-spacing: var(--letter-spacing-recommendations-side-head);
  text-transform: uppercase;
}

h4 {
  margin: 0;
  font-size: var(--font-size-why-panel-title);
  font-weight: var(--font-weight-headings-heavy);
}

/* Why this?'s and the collaborators panel's close, pulled toward the corner. */
.close {
  display: grid;
  place-items: center;
  inline-size: var(--why-close);
  block-size: var(--why-close);
  min-block-size: 0;
  margin-block-start: calc(-1 * var(--why-close-pull));
  margin-inline-end: calc(-1 * var(--why-close-pull));
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: none;
  color: var(--color-why-faint);
  cursor: pointer;

  &:is(:hover, :focus-visible) {
    background: var(--color-why-more-hover);
    color: var(--color-why-text);
  }
}

.rows {
  display: grid;
  margin: 0;
  padding: var(--why-list-padding);
  list-style: none;
}

/* An emoji, its share of all the reactions as a bar, and its count. */
.row {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: var(--space-why-row);
  inline-size: 100%;
  min-block-size: 0;
  padding: var(--why-row-padding);
  border: 0;
  border-radius: var(--radius-control);
  background: none;
  color: inherit;
  font: inherit;
  text-align: start;
}

button.row {
  cursor: pointer;

  &:is(:hover, :focus-visible) {
    background: var(--color-why-more-hover);
  }

  &[aria-disabled='true'] {
    cursor: wait;
  }
}

.yours {
  background: var(--color-comment-reaction-mine);

  &:is(:hover, :focus-visible) {
    background: var(--color-comment-reaction-mine-hover);
  }
}

.zero {
  color: var(--color-why-faint);

  & .big-emoji {
    opacity: var(--opacity-reaction-breakdown-zero);
  }
}

/* The emoji, with its name in the tooltips' black box to its left, pointing at it. */
.lead {
  position: relative;
  display: inline-flex;
}

.tip {
  position: absolute;
  inset-block-start: 50%;
  inset-inline-end: calc(100% + var(--tooltip-arrow) + var(--reaction-tip-gap) + var(--reaction-tip-inset));
  z-index: 1;
  padding: var(--space-tooltip);
  border-radius: var(--radius-tooltip);
  background-color: var(--color-tooltip-bg);
  color: var(--color-tooltip-text);
  font-size: var(--font-size-small);
  font-weight: normal;
  line-height: var(--line-height-tooltip);
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  translate: 0 -50%;
  transition: opacity var(--transition-tooltip);

  &::after {
    content: '';
    position: absolute;
    inset-block-start: calc(50% - var(--tooltip-arrow));
    inset-inline-start: 100%;
    border: var(--tooltip-arrow) solid transparent;
    border-inline-start-color: var(--color-tooltip-bg);
  }

  .row:is(:hover, :focus-visible) & {
    opacity: var(--opacity-tooltip);
  }
}

.big-emoji {
  font-size: var(--font-size-reaction-row-emoji);
  line-height: 1;
}

.share {
  block-size: var(--reaction-share-height);
  overflow: hidden;
  border-radius: var(--reaction-share-height);
  background: var(--color-dialog-art-meter-track);

  & span {
    display: block;
    block-size: 100%;
    border-radius: inherit;
    background: var(--color-reaction-share);
  }
}

.count {
  min-inline-size: var(--reaction-count-width);
  font-family: var(--font-headings);
  font-weight: var(--font-weight-headings-heavy);
  font-variant-numeric: tabular-nums;
  text-align: end;
}

.foot {
  margin: 0;
  padding: var(--why-foot-padding);
  border-block-start: 1px solid var(--color-why-border);
  color: var(--color-why-faint);
  font-size: var(--font-size-small);
}

@media (prefers-reduced-motion: no-preference) {
  .big-emoji {
    transition: transform var(--transition-comment-quiet);
  }

  button.choice:hover .big-emoji {
    transform: scale(var(--reaction-breakdown-hover-scale));
  }
}

@media (prefers-reduced-motion: reduce) {
  .pick,
  .more,
  .tip,
  button.choice {
    transition: none;
  }
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
