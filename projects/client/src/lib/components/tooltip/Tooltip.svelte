<!--
  og's tooltip: a `TooltipBox` (dark, a hairline border and an arrow) on a `hint` popover anchored to its trigger.
  The trigger snippet gets the props to spread onto the element the tooltip describes:
    <Tooltip text="Add to watched history" placement="bottom">
      {#snippet trigger(tooltip)}
        <button type="button" aria-label="Add to watched history" {...tooltip}>...</button>
      {/snippet}
    </Tooltip>
  It shows while the mouse is over the trigger (or the tooltip) and while the trigger has keyboard focus, and Esc,
  blur or the mouse leaving hides it. It never opens on touch, unless it `toggles`: a chart mark's tooltip also opens
  and shuts on a click or tap. Near the edge of the screen it flips to the other side.
  Three bodies, one of them per tooltip:
  - `text`: centered and balanced, breaking lines at `\n`.
  - `stats`: the charts' label, big value and dashed lines (`TooltipStat`), a divider between groups.
  - `children`: anything else, like the library card. It's centered unless it aligns itself.
  A component that takes a tooltip from its caller and hands it on passes `content`, which is any of the three.
  Left without any, no tooltip renders. The trigger keeps its own accessible name: the tooltip only describes it
  (`aria-describedby`), and not even that when it just repeats the name ("Edit note" on an "Edit note" button).
-->
<script lang="ts">
import type { Snippet } from 'svelte';
import { type Attachment, createAttachmentKey } from 'svelte/attachments';
import { anchorNames } from './anchorNames.ts';
import { repeatsName } from './repeatsName.ts';
import type { StatTip } from './StatTip.ts';
import type { TooltipContent } from './TooltipContent.ts';
import { tooltipFlip } from './tooltipFlip.ts';
import type { TooltipPlacement } from './TooltipPlacement.ts';
import TooltipBox from './TooltipBox.svelte';
import TooltipStat from './TooltipStat.svelte';
import { type TooltipEvent, type TooltipState, tooltipState } from './tooltipState.ts';

type TriggerProps = { 'aria-describedby'?: string; [key: symbol]: Attachment<HTMLElement> };

interface Props {
  trigger: Snippet<[TriggerProps]>;
  text?: string;
  stats?: readonly StatTip[];
  children?: Snippet;
  content?: TooltipContent;
  /** Which side of the trigger it shows on. Bootstrap's default is top. */
  placement?: TooltipPlacement;
  /** A click or tap opens and shuts it too, for chart marks, which touch can't hover. */
  toggles?: boolean;
}

const { trigger, text, stats, children, content, placement = 'top', toggles = false }: Props = $props();
const id = $props.id();

let status = $state<TooltipState>({ hovered: false, focused: false, pinned: false, dismissed: false, open: false });
let anchor = $state<HTMLElement>();
let tip = $state<HTMLElement>();
let side = $state<TooltipPlacement>();
let repeats = $state(false);
const shown = $derived(side ?? placement);

const send = (event: TooltipEvent) => (status = tooltipState(status, event));
const inside = (element: Element | undefined, target: EventTarget | null) =>
  target instanceof Node && Boolean(element?.contains(target));

const attach: Attachment<HTMLElement> = (node) => {
  anchor = node;
  // Beside any anchor the trigger already is, like a rating popover's: replacing it would leave that popover unplaced.
  const name = `--tooltip-${id}`;
  node.style.setProperty('anchor-name', anchorNames(node.style.getPropertyValue('anchor-name'), { add: name }));

  const enter = (event: PointerEvent) => {
    if (event.pointerType !== 'touch') send('enter');
  };
  // Moving onto the tooltip itself keeps it open.
  const leave = (event: PointerEvent) => {
    if (!inside(tip, event.relatedTarget)) send('leave');
  };
  // Only keyboard focus: a click or a tap focuses a button too, and shouldn't pop a tooltip.
  const focus = (event: FocusEvent) => {
    if (event.target instanceof Element && event.target.matches(':focus-visible')) send('focus');
  };
  // Removing a focused trigger (a spoiler that reveals itself) fires this while Svelte is tearing the DOM down, where
  // state can't change, so the update waits a microtask.
  const blur = (event: FocusEvent) => {
    if (!inside(node, event.relatedTarget)) queueMicrotask(() => send('blur'));
  };

  const click = () => {
    if (toggles) send(status.open ? 'dismiss' : 'focus');
  };
  node.addEventListener('click', click);
  node.addEventListener('pointerenter', enter);
  node.addEventListener('pointerleave', leave);
  node.addEventListener('focusin', focus);
  node.addEventListener('focusout', blur);
  return () => {
    node.removeEventListener('click', click);
    node.removeEventListener('pointerenter', enter);
    node.removeEventListener('pointerleave', leave);
    node.removeEventListener('focusin', focus);
    node.removeEventListener('focusout', blur);
    const rest = anchorNames(node.style.getPropertyValue('anchor-name'), { remove: name });
    if (rest) node.style.setProperty('anchor-name', rest);
    else node.style.removeProperty('anchor-name');
    anchor = undefined;
  };
};

const words = $derived(text ?? (typeof content === 'string' ? content : undefined));
const groups = $derived(stats ?? (typeof content === 'object' ? content : undefined));
const markup = $derived(children ?? (typeof content === 'function' ? content : undefined));

const key = createAttachmentKey();
const hasTip = $derived(Boolean(words) || Boolean(groups?.length) || Boolean(markup));
const triggerProps = $derived<TriggerProps>(
  hasTip ? { 'aria-describedby': repeats ? undefined : `tooltip-${id}`, [key]: attach } : {},
);

// The trigger's name as a screen reader builds it: its label, else its text and its icons' and images' labels.
const nameOf = (node: HTMLElement) =>
  node.getAttribute('aria-label') ??
  node.getAttribute('alt') ??
  [
    node.textContent ?? '',
    ...[...node.querySelectorAll('[aria-label], img[alt]')].map(
      (child) => child.getAttribute('aria-label') ?? child.getAttribute('alt') ?? '',
    ),
  ].join(' ');

$effect(() => {
  if (!anchor || !tip) return;
  // Read so a new text checks again.
  void words;
  repeats = repeatsName(nameOf(anchor), tip.textContent ?? '');
});

// It opens on its preferred side, then flips once if it runs off the screen there. Shut, it goes back.
$effect(() => {
  if (!tip || !anchor) return;
  if (status.open === tip.matches(':popover-open')) return;
  if (!status.open) {
    tip.hidePopover();
    side = undefined;
    return;
  }
  tip.showPopover({ source: anchor });
  const flipped = tooltipFlip({
    placement,
    box: tip.getBoundingClientRect(),
    viewport: { width: document.documentElement.clientWidth, height: document.documentElement.clientHeight },
  });
  if (flipped !== placement) side = flipped;
});

// `hint` popovers close on Esc by themselves. Browsers without `hint` treat it as `manual`, so listen too.
$effect(() => {
  if (!status.open) return;
  const escape = (event: KeyboardEvent) => {
    if (event.key === 'Escape') send('dismiss');
  };
  document.addEventListener('keydown', escape);
  return () => document.removeEventListener('keydown', escape);
});

// The browser light-dismissed it (Esc, a click elsewhere): stay shut until the next hover or focus.
const closed = (event: ToggleEvent & { currentTarget: HTMLElement }) => {
  if (status.open && !event.currentTarget.matches(':popover-open')) send('dismiss');
};

const leaveTip = (event: PointerEvent) => {
  if (!inside(anchor, event.relatedTarget)) send('leave');
};
</script>

<!--
  Spans, so a tooltip can sit inside a paragraph (comment text) without breaking it, and no whitespace after the
  trigger, which would show up as a space in running text.
-->
{@render trigger(triggerProps)}{#if hasTip}
  <span
  bind:this={tip}
  id="tooltip-{id}"
  class={['tooltip', shown]}
  popover="hint"
  role="tooltip"
  style:position-anchor="--tooltip-{id}"
  ontoggle={closed}
  onpointerleave={leaveTip}
>
    <TooltipBox side={shown}>
      {#if markup}
        {@render markup()}
      {:else if groups?.length}
        {#each groups as stat, i (i)}{#if i > 0}<span class="divider"></span>{/if}<TooltipStat {...stat} />{/each}
      {:else}
        <span class="text">{words}</span>
      {/if}
    </TooltipBox>
  </span>
{/if}

<style>
/*
  The popover runs from the trigger's edge to the far side of the box, so the pointer can move onto the tooltip
  without a gap closing it. The box's arrow sits in that padding, 3px off the trigger like Bootstrap's.
*/
.tooltip {
  --edge: calc(var(--tooltip-arrow) + 1px + var(--tooltip-offset));
  position: fixed;
  inset: auto;
  inline-size: max-content;
  margin: 0;
  padding: 0;
  overflow: visible;
  border: 0;
  background: none;
  transition: opacity var(--transition-tooltip), display var(--transition-tooltip) allow-discrete,
    overlay var(--transition-tooltip) allow-discrete;

  @starting-style {
    opacity: 0;
  }

  &:not(:popover-open) {
    opacity: 0;
  }
}

/* OG joined tooltip lines with <br>. */
.text {
  white-space: pre-line;
}

/* OG's `.tooltip-hr`, between a rewatch and the whole show. */
.divider {
  display: block;
  margin-block: var(--space-tooltip-divider);
  border-block-start: 1px solid var(--color-tooltip-divider);
}

.top {
  position-area: block-start center;
  padding-block-end: var(--edge);
}

.bottom {
  position-area: block-end center;
  padding-block-start: var(--edge);
}

.left {
  position-area: center inline-start;
  padding-inline-end: var(--edge);
}

.right {
  position-area: center inline-end;
  padding-inline-start: var(--edge);
}

@media (prefers-reduced-motion: reduce) {
  .tooltip {
    transition: none;
  }
}
</style>
