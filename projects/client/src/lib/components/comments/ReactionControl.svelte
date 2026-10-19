<!--
  A comment's React button and OG's seven-emoji popover. Off, it's the card's glass button with the add-reaction face;
  once the viewer has reacted it turns solid blue with their emoji and its name ("👍 Like"), and opens the popover to
  change or take back the reaction. The popover is a panel like Why this?: a header, the seven emoji in a row (each
  named in a tooltip of its own, the viewer's ringed in blue), and a line on taking it back. Native popovers provide Escape and light dismiss.
-->
<script lang="ts">
import Icon from '$lib/icons/Icon.svelte';
import smile from '$lib/icons/solid/face-smile-plus.svg?raw';
import xmark from '$lib/icons/regular/xmark.svg?raw';
import GlassAction from '$lib/components/glass-action/GlassAction.svelte';
import { reactionOptions } from '$lib/components/comments/reactionOptions';

interface Props {
  value?: typeof reactionOptions[number]['type'];
  busy?: boolean;
  onopen: () => Promise<boolean>;
  onselect: (type: typeof reactionOptions[number]['type']) => void;
}
const { value, busy = false, onopen, onselect }: Props = $props();
const id = $props.id();
const selected = $derived(reactionOptions.find((option) => option.type === value));
let trigger = $state<HTMLButtonElement>();
let popover = $state<HTMLDivElement>();
let expanded = $state(false);
let opening = $state(false);

async function open() {
  if (busy || opening) return;
  opening = true;
  try {
    if (await onopen()) popover?.togglePopover();
  } finally {
    opening = false;
  }
}
function toggle(event: ToggleEvent) {
  expanded = event.newState === 'open';
  if (expanded) {
    (popover?.querySelector<HTMLButtonElement>('[aria-pressed="true"]') ??
      popover?.querySelector<HTMLButtonElement>('.choice'))?.focus();
  } else {
    trigger?.focus({ preventScroll: true });
  }
}
function choose(type: typeof reactionOptions[number]['type']) {
  if (busy) return;
  popover?.hidePopover();
  onselect(type);
}
</script>

<button
  bind:this={trigger}
  type="button"
  class="reaction-trigger"
  style:anchor-name="--reaction-{id}"
  aria-label={selected ? `Edit your ${selected.label.toLowerCase()} reaction` : 'React'}
  aria-controls="reaction-{id}"
  aria-haspopup="dialog"
  aria-expanded={expanded}
  aria-busy={busy || opening}
  aria-disabled={busy || opening}
  onclick={open}
>
  <GlassAction presentational card glass={!selected} color={selected ? 'var(--color-comment-reacted)' : undefined}
    selected={Boolean(selected)} icon={selected ? undefined : smile} iconColor="var(--color-comment-react-icon)">
    {#if selected}<span class="emoji-icon" aria-hidden="true">{selected.emoji}</span>{/if}<span class="add-text">{selected?.label ?? 'React'}</span>
  </GlassAction>
</button>
<div
  bind:this={popover}
  id="reaction-{id}"
  class="reaction-popover"
  role="dialog"
  aria-labelledby="reaction-{id}-title"
  popover="auto"
  style:position-anchor="--reaction-{id}"
  ontoggle={toggle}
>
  <header>
    <div>
      <span class="eyebrow"><Icon svg={smile} />React</span>
      <h4 id="reaction-{id}-title">{selected ? `You reacted ${selected.label}` : 'Add a reaction'}</h4>
    </div>
    <button class="close" type="button" aria-label="Close" onclick={() => popover?.hidePopover()}>
      <Icon svg={xmark} />
    </button>
  </header>
  <div class="choices">
    {#each reactionOptions as option (option.type)}
      <button
        class="choice"
        type="button"
        aria-label={option.label}
        aria-pressed={value === option.type}
        onclick={() => choose(option.type)}
      >
        <span class="choice-emoji" aria-hidden="true">{option.emoji}</span>
        <span class="tip" aria-hidden="true">{option.label}</span>
      </button>
    {/each}
  </div>
  <p
    class="foot">{selected ? `Pick ${selected.label} again to take it back.` : 'One reaction per comment; pick another to switch.'}</p>
</div>

<style>
.reaction-trigger {
  display: inline-flex;
  min-block-size: 0;
  padding: 0;
  border: 0;
  border-radius: var(--radius-control);
  background: none;
  color: inherit;
  font: inherit;
  text-transform: none;
  cursor: pointer;

  /* Centred by the face's circle, not the glyph box the plus sticks out of. */
  & :global(.icon) {
    --icon-shift: var(--comment-react-icon-circle-offset);
    flex: none;
    font-size: var(--font-size-comment-react-icon);
  }
  &[aria-disabled='true'] {
    cursor: wait;
  }
}
.emoji-icon {
  font-size: var(--font-size-comment-reaction-emoji);
  line-height: 1;
  translate: 0 var(--comment-reaction-emoji-shift);
}
/* Centred above React, pointing down at it: a panel like Why this?. */
.reaction-popover {
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

/* The seven in one row. */
.choices {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: var(--reaction-tile-gap);
  padding: var(--why-list-padding);
}

.choice {
  position: relative;
  display: grid;
  place-items: center;
  aspect-ratio: 1;
  min-block-size: 0;
  padding: var(--reaction-tile-padding);
  border: 1px solid transparent;
  border-radius: var(--radius-control);
  background: none;
  color: var(--color-why-faint);
  font: inherit;
  cursor: pointer;
  transition: background-color var(--transition-comment-quiet), border-color var(--transition-comment-quiet);

  &:is(:hover, :focus-visible) {
    background: var(--color-why-more-hover);
    color: var(--color-why-text);
  }

  &[aria-pressed='true'] {
    border-color: var(--color-reaction-you);
    background: var(--color-comment-reaction-mine);
    color: var(--color-comment-reaction-mine-text);
  }
}

/*
  The tile's name, in the tooltips' black box over it. Its own rather than a Tooltip: a tooltip anchored inside this
  anchored panel lands where the panel was before it moved into place.
*/
.tip {
  position: absolute;
  inset-block-end: calc(100% + var(--tooltip-arrow) + var(--reaction-tip-gap));
  inset-inline-start: 50%;
  z-index: 1;
  padding: var(--space-tooltip);
  border-radius: var(--radius-tooltip);
  background-color: var(--color-tooltip-bg);
  color: var(--color-tooltip-text);
  font-size: var(--font-size-small);
  line-height: var(--line-height-tooltip);
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  translate: -50% 0;
  transition: opacity var(--transition-tooltip);

  &::after {
    content: '';
    position: absolute;
    inset-block-start: 100%;
    inset-inline-start: calc(50% - var(--tooltip-arrow));
    border: var(--tooltip-arrow) solid transparent;
    border-block-start-color: var(--color-tooltip-bg);
  }

  .choice:is(:hover, :focus-visible) > & {
    opacity: var(--opacity-tooltip);
  }
}

.choice-emoji {
  font-size: var(--font-size-reaction-tile-emoji);
  line-height: 1;
}

.foot {
  margin: 0;
  padding: var(--why-foot-padding);
  border-block-start: 1px solid var(--color-why-border);
  color: var(--color-why-faint);
  font-size: var(--font-size-small);
}

@media (prefers-reduced-motion: no-preference) {
  .choice-emoji {
    transition: transform var(--reaction-duration);
  }

  .choice:hover .choice-emoji {
    transform: scale(var(--reaction-hover-scale));
  }
}

@media (prefers-reduced-motion: reduce) {
  .choice,
  .tip {
    transition: none;
  }
}

@media (max-width: 767px) {
  .add-text {
    position: absolute;
    inline-size: 1px;
    block-size: 1px;
    overflow: hidden;
    clip-path: inset(50%);
  }
  .reaction-popover {
    font-size: var(--reaction-mobile-size);
  }
}
</style>
