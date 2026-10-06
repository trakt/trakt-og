<!--
  The reaction summary at the end of a comment's action row: the three biggest reaction kinds as soft chips with their
  counts, then "+N" when more kinds have any. "+N" opens the breakdown of all seven with their counts, where a signed-in
  viewer reacts or takes their reaction back, as in the picker. Native popovers provide Escape and light dismiss.
  The viewer's own reaction looks like the others; screen readers hear "including yours".
-->
<script lang="ts">
import type { reactionOptions } from './reactionOptions.ts';
import type { ReactionCount, ReactionSummary } from './reactionSummary.ts';

type ReactionType = typeof reactionOptions[number]['type'];

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
      <li class="chip">
        <span class="emoji" aria-hidden="true">{reaction.emoji}</span>
        <span aria-hidden="true">{reaction.text}</span>
        <span class="visually-hidden">{named(reaction)}</span>
      </li>
    {/each}
  </ul>
  {#if summary.more > 0}
    <button
      bind:this={more}
      type="button"
      class="more"
      style:anchor-name="--reactions-{id}"
      aria-label="{summary.more} more, show all reactions"
      aria-controls="reactions-{id}"
      aria-haspopup="dialog"
      aria-expanded={expanded}
      onclick={() => popover?.togglePopover()}
    >
      +{summary.more}
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
      <p class="caption">{summary.total}</p>
      {#each summary.all as reaction (reaction.type)}
        {#if onselect}
          <button
            type="button"
            class={['choice', { zero: reaction.count === 0 }]}
            aria-label={named(reaction)}
            aria-pressed={reaction.type === mine}
            aria-disabled={busy}
            onclick={() => choose(reaction.type)}
          >
            <span class="big-emoji" aria-hidden="true">{reaction.emoji}</span>{reaction.text}
          </button>
        {:else}
          <span class={['choice', { zero: reaction.count === 0 }]}>
            <span class="big-emoji" aria-hidden="true">{reaction.emoji}</span>
            <span aria-hidden="true">{reaction.text}</span>
            <span class="visually-hidden">{reaction.name}</span>
          </span>
        {/if}
      {/each}
    </div>
  {/if}
</div>

<style>
/* At the row's end; on a narrow card it wraps under the actions, still at the end. */
.reactions {
  display: inline-flex;
  align-items: center;
  gap: var(--comment-reactions-gap);
  margin-inline-start: auto;
}

.top {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--comment-reactions-gap);
  margin: 0;
  padding: 0;
  list-style: none;
}

.chip,
.more {
  display: inline-flex;
  align-items: center;
  block-size: var(--comment-reaction-chip-height);
  border-radius: var(--radius-comment-reaction-chip);
  font-size: var(--font-size-comment-reaction-chip);
}

.chip {
  gap: var(--comment-reaction-count-gap);
  padding: var(--comment-reaction-chip-padding);
  background-color: var(--color-comment-chip);
  color: var(--color-text);
  cursor: default;
}

.emoji {
  font-size: var(--font-size-comment-reaction-emoji);
  line-height: 1;
  translate: 0 var(--comment-reaction-emoji-shift);
}

.more {
  min-block-size: 0;
  padding: var(--comment-reaction-more-padding);
  border: 0;
  background: none;
  color: inherit;
  font-family: inherit;
  font-weight: var(--font-weight-headings-heavy);
  cursor: pointer;
  transition: background-color var(--transition-comment-quiet), color var(--transition-comment-quiet);

  &:hover,
  &[aria-expanded='true'] {
    background-color: var(--color-comment-chip);
    color: var(--color-text);
  }
}

/* Above the "+N", lined up with its end, or below it when there's no room. */
.breakdown {
  position: fixed;
  position-area: block-start span-inline-start;
  position-try-fallbacks: flip-block, flip-inline;
  inset: auto;
  margin: var(--reaction-breakdown-gap) 0;
  padding: var(--reaction-breakdown-padding);
  overflow: visible;
  border: 1px solid var(--color-reaction-breakdown-border);
  border-radius: var(--radius-reaction-breakdown);
  background-color: var(--color-reaction-breakdown-bg);
  color: var(--color-comment-muted);
  box-shadow: var(--shadow-reaction-breakdown);
  font-family: var(--font-headings);
  font-weight: var(--font-weight-headings-heavy);
  text-transform: none;

  &:popover-open {
    display: grid;
    grid-template-columns: repeat(7, auto);
    gap: var(--reaction-breakdown-item-gap);
  }
}

.caption {
  grid-column: 1 / -1;
  margin: var(--reaction-breakdown-caption-margin);
  font-size: var(--font-size-reaction-breakdown-caption);
  letter-spacing: var(--letter-spacing-comment-rail-label);
  text-transform: uppercase;
}

.choice {
  display: grid;
  justify-items: center;
  align-content: start;
  gap: var(--reaction-breakdown-emoji-gap);
  min-inline-size: var(--reaction-breakdown-item-width);
  min-block-size: 0;
  padding: var(--reaction-breakdown-item-padding);
  border: 0;
  border-radius: var(--radius-reaction-breakdown-item);
  background: none;
  color: inherit;
  font: inherit;
  font-size: var(--font-size-reaction-breakdown-count);
  line-height: 1;
}

button.choice {
  cursor: pointer;
  transition: background-color var(--transition-comment-quiet), color var(--transition-comment-quiet);

  &:hover,
  &[aria-pressed='true'] {
    background-color: var(--color-comment-chip);
    color: var(--color-text);
  }

  &[aria-disabled='true'] {
    cursor: wait;
  }
}

.zero {
  opacity: var(--opacity-reaction-breakdown-zero);
}

.big-emoji {
  font-size: var(--font-size-reaction-breakdown-emoji);
  line-height: 1;
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
  .more,
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
