<script lang="ts">
import type { Snippet } from 'svelte';
import RatingHearts from '$lib/components/rating/RatingHearts.svelte';
import Tooltip from '$lib/components/tooltip/Tooltip.svelte';
import { ratingPrompt } from '$lib/components/rating/ratingPrompt';
import { rating10 } from '$lib/extras/rating10.svelte';
import Icon from '$lib/icons/Icon.svelte';
import trash from '$lib/icons/regular/trash-xmark.svg?raw';

interface Props {
  label: string;
  value: number | null;
  onrate: (rating: number | null) => void;
  /** Return false when opening starts sign-in instead. */
  onopen?: () => Promise<boolean>;
  busy?: boolean;
  /** Why rating is off ("Watch it first to rate it"): the trigger stays, disabled, with this as its tooltip. */
  locked?: string;
  /** The trigger's tooltip while rating is open: a bold first line, then a detail line, split at `\n`. */
  hint?: (value: number | null) => string;
  trigger: Snippet<[{ value: number | null; preview: number | null; busy: boolean }]>;
  variant?: 'summary' | 'card';
}
const {
  label,
  value,
  onrate,
  onopen,
  busy = false,
  locked,
  hint,
  trigger: triggerContent,
  variant = 'card',
}: Props = $props();
const id = $props.id();
let button = $state<HTMLButtonElement>();
let popover = $state<HTMLDivElement>();
let preview = $state<number | null>(null);
let expanded = $state(false);
let opened = $state(false);
const prompt = $derived(ratingPrompt(value, preview));
const tip = $derived(locked ?? hint?.(value));
// The title bar takes the color of the rating being pointed at, or the saved one at rest.
const tone = $derived.by(() => {
  if (prompt.tint === 'unrate') return 'var(--brand-primary)';
  if (prompt.tint === null) return undefined;
  return `var(--rating-${prompt.tint})`;
});

async function open() {
  if (busy || locked || (onopen && !(await onopen()))) return;
  popover?.togglePopover();
}

// The hearts send null for the saved rating picked again, like the trash button.
function rate(rating: number | null) {
  if (busy) return;
  popover?.hidePopover();
  onrate(rating);
  if (rating === 10) rating10.show();
}

function toggle(event: ToggleEvent) {
  expanded = event.newState === 'open';
  if (expanded) {
    (popover?.querySelector<HTMLInputElement>('input:checked') ?? popover?.querySelector<HTMLInputElement>('input'))
      ?.focus();
    return;
  }
  preview = null;
  button?.focus({ preventScroll: true });
}
</script>

<Tooltip text={expanded ? undefined : tip} variant={locked ? 'default' : 'titled'}
  placement={variant === 'summary' ? 'top' : 'bottom'}>
  {#snippet trigger(tooltip)}
    <button
      bind:this={button}
      type="button"
      class={['rating-trigger', variant, { locked }]}
      style:anchor-name="--rating-{id}"
      aria-label={label}
      aria-controls="rating-{id}"
      aria-haspopup="dialog"
      aria-expanded={expanded}
      aria-busy={busy}
      aria-disabled={busy || Boolean(locked)}
      onclick={open}
      {...tooltip}
    >
      {@render triggerContent({ value, preview, busy })}
    </button>
  {/snippet}
</Tooltip>
<div
  bind:this={popover}
  id="rating-{id}"
  class={['rating-popover', variant, { toned: tone }]}
  popover="auto"
  role="dialog"
  aria-label={label}
  style:position-anchor="--rating-{id}"
  style:--tone={tone}
  onbeforetoggle={(event) => { if (event.newState === 'open') opened = true; }}
  ontoggle={toggle}
>
  <!-- The shared prompt's look: a title bar tinted in the rating's color over the hearts. The title follows the heart
       being pointed at and stays centered; the trash sits at its end once there's a rating. -->
  <header class="head">
    <p class="readout" aria-live="polite">{#if prompt.strong}<b>{prompt.strong}</b>{/if}{prompt.text}</p>
    {#if value !== null}
      <Tooltip text="Remove Rating">
        {#snippet trigger(tooltip)}
          <button type="button" class="remove" aria-label="Remove your rating of {value}" onclick={() => rate(null)}
            {...tooltip}><Icon svg={trash} /></button>
        {/snippet}
      </Tooltip>
    {/if}
  </header>
  {#if opened}
    <div class="body">
      <RatingHearts {value} onrate={rate} onpreview={(rating) => (preview = rating)} />
    </div>
  {/if}
</div>

<style>
.rating-trigger {
  display: block;
  min-block-size: 0;
  padding: 0;
  border: 0;
  background: none;
  color: inherit;
  font: inherit;
  text-align: start;
  cursor: pointer;
  &:focus-visible {
    outline: var(--rating-focus-width) solid var(--color-input-border-focus);
    outline-offset: var(--rating-focus-width);
  }
  &[aria-disabled='true'] {
    cursor: wait;
    opacity: var(--rating-busy-opacity);
  }
  /* Locked until watched: the hearts won't open. A card's community percentage still reads at full strength; the
     summary's Rate button fades like a disabled action. */
  &.locked {
    cursor: not-allowed;
  }
  &.locked.summary {
    opacity: var(--opacity-action-disabled);
  }
}
/* PromptPopover's surface (the dropdown menu's), at OG's width, with an arrow at the trigger. */
.rating-popover {
  --tone: var(--color-prompt-neutral);
  --head: color-mix(in srgb, var(--tone) var(--prompt-tint), var(--color-menu-bg));
  &.toned {
    --head: var(--tone);
  }
  position: fixed;
  position-area: bottom;
  position-try-fallbacks: flip-block;
  inset: auto;
  inline-size: var(--rating-popover-width);
  max-inline-size: calc(100vw - var(--gutter));
  /* Far enough out that the arrow's tip stops short of the trigger. */
  margin: calc(var(--rating-meter-arrow) * 0.7071 + 1px + var(--rating-arrow-gap)) 0;
  padding: 0;
  overflow: visible;
  border: 1px solid var(--color-menu-border);
  border-radius: var(--radius-menu);
  background-color: var(--color-menu-bg);
  color: var(--color-dropdown-menu-text);
  box-shadow: var(--shadow-menu);
  text-align: center;
  font: var(--font-size-base) / var(--line-height-base) var(--font-body);
  text-shadow: none;
  /* A summary's Rate button sits low on the fanart with room above, so its popover always opens upward: a flip would
     leave the arrow pointing away from the button. Cards open below and may flip to stay on screen. */
  &.summary {
    position-area: top;
    position-try-fallbacks: none;
  }
  /* The arrow: a turned square, in the title bar's tint below a card's trigger and the surface above a summary's. */
  &::after {
    content: '';
    position: absolute;
    inset-inline-start: calc(50% - var(--rating-meter-arrow) / 2);
    inset-block-start: calc(var(--rating-meter-arrow) / -2 - 1px);
    inline-size: var(--rating-meter-arrow);
    block-size: var(--rating-meter-arrow);
    border: 1px solid var(--color-menu-border);
    border-block-end-color: transparent;
    border-inline-end-color: transparent;
    background: var(--head);
    rotate: 45deg;
    transition: background-color var(--transition-rating-tint);
  }
  &.summary::after {
    inset-block-start: auto;
    inset-block-end: calc(var(--rating-meter-arrow) / -2 - 1px);
    border-color: var(--color-menu-border);
    border-block-start-color: transparent;
    border-inline-start-color: transparent;
    background: var(--color-menu-bg);
  }
}
/* PromptPopover's title bar, tinted in the rating's color as the pointer moves. */
.head {
  position: relative;
  padding: var(--space-prompt-head);
  padding-inline: var(--rating-head-inline);
  border-block-end: 1px solid color-mix(in srgb, var(--tone) var(--prompt-tint-border), var(--color-menu-border));
  .toned & {
    border-block-end-color: var(--tone);
  }
  border-radius: var(--radius-menu) var(--radius-menu) 0 0;
  background: var(--head);
  transition: background-color var(--transition-rating-tint), border-color var(--transition-rating-tint);
}
.readout {
  margin: 0;
  color: var(--color-prompt-title);
  font-family: var(--font-headings);
  font-size: var(--font-size-prompt-title);
  font-weight: var(--font-weight-headings-heavy);
  line-height: var(--line-height-prompt-title);
  white-space: nowrap;
  transition: color var(--transition-rating-tint);
  /* On a rating's full color, white reads from gray to red. */
  .toned & {
    color: var(--color-rating-head-text);
  }
}
/* At the bar's end, out of the centered title's way. */
.remove {
  position: absolute;
  inset-block-start: 50%;
  inset-inline-end: var(--rating-remove-end);
  translate: 0 -50%;
  display: grid;
  place-items: center;
  inline-size: var(--prompt-close-size);
  block-size: var(--prompt-close-size);
  min-block-size: 0;
  padding: 0;
  border: 0;
  border-radius: var(--radius-menu-row);
  background: none;
  color: var(--color-menu-header);
  font-size: var(--font-size-prompt-close);
  cursor: pointer;
  .toned & {
    color: var(--color-rating-head-text);
  }
  &:is(:hover, :focus-visible) {
    background-color: var(--color-rating-remove-hover);
    color: var(--color-rating-head-text);
    outline: none;
  }
}
.body {
  padding: var(--rating-popover-body-block) var(--rating-popover-body-inline);
}
@media (prefers-reduced-motion: reduce) {
  .head,
  .rating-popover::after {
    transition: none;
  }
}
</style>
