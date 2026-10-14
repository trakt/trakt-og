<!--
  The owner's notes on a list poster: a glass "Read Note" pill centred over the poster's bottom, and a glass sheet that
  slides up the poster with the notes. Hovering or focusing the pill opens it, a click or tap pins it open, and Esc, a
  click elsewhere or the pointer leaving the poster shuts it. Notes taller than the poster scroll inside it, the bottom
  edge fading until the end. With `onedit`, the sheet has a pencil for the list's editors. Place it over the poster
  (PosterCard's `posterOverlay`).
    <ReadNotes notes="Watch the director's cut:fire:" onedit={canEdit ? openNotesDialog : undefined} />
-->
<script lang="ts">
import type { Attachment } from 'svelte/attachments';
import CommentText from '$lib/components/comments/CommentText.svelte';
import Tooltip from '$lib/components/tooltip/Tooltip.svelte';
import { parseComment } from '$lib/components/comments/text/parseComment';
import { type TooltipEvent, type TooltipState, tooltipState } from '$lib/components/tooltip/tooltipState';
import Icon from '$lib/icons/Icon.svelte';
import memo from '$lib/icons/solid/memo.svg?raw';
import pen from '$lib/icons/solid/pen.svg?raw';
import NotesPill from './NotesPill.svelte';
import { scrollsBelow } from './scrollsBelow.ts';

interface Props {
  notes: string;
  /** Someone who can edit the list: a pencil in the sheet opens the notes for editing. */
  onedit?: () => void;
}

const { notes, onedit }: Props = $props();
const id = $props.id();
const blocks = $derived(parseComment(notes));

let status = $state<TooltipState>({ hovered: false, focused: false, pinned: false, dismissed: false, open: false });
let root = $state<HTMLElement>();
let fades = $state(false);

const send = (event: TooltipEvent) => (status = tooltipState(status, event));
const outside = (target: EventTarget | null) => !(target instanceof Node && root?.contains(target));

const enter = (event: PointerEvent) => {
  if (event.pointerType !== 'touch') send('enter');
};
const leave = (event: PointerEvent) => {
  if (outside(event.relatedTarget)) send('leave');
};
// Only keyboard focus: a click or a tap focuses the pill too, and that already toggles it.
const focus = (event: FocusEvent & { currentTarget: HTMLElement }) => {
  if (event.currentTarget.matches(':focus-visible')) send('focus');
};
const blur = (event: FocusEvent) => {
  if (outside(event.relatedTarget)) send('blur');
};
// While open, the whole poster belongs to the notes: a click on it shuts them, unless it's a link in the notes.
const shut = (event: MouseEvent) => {
  if (event.target instanceof Element && event.target.closest('a')) return;
  send('dismiss');
};

const editNotes = (event: MouseEvent) => {
  event.stopPropagation();
  send('dismiss');
  onedit?.();
};

const fade: Attachment<HTMLElement> = (node) => {
  const measure = () => (fades = scrollsBelow(node));
  const observer = new ResizeObserver(measure);
  observer.observe(node);
  node.addEventListener('scroll', measure, { passive: true });
  return () => {
    observer.disconnect();
    node.removeEventListener('scroll', measure);
  };
};

$effect(() => {
  if (!status.open) return;
  const escape = (event: KeyboardEvent) => {
    if (event.key === 'Escape') send('dismiss');
  };
  document.addEventListener('keydown', escape);
  return () => document.removeEventListener('keydown', escape);
});

$effect(() => {
  if (!status.pinned) return;
  const away = (event: PointerEvent) => {
    if (outside(event.target)) send('dismiss');
  };
  document.addEventListener('pointerdown', away);
  return () => document.removeEventListener('pointerdown', away);
});
</script>

<!-- Esc shuts the notes from the keyboard; the click here is the pointer's way to do the same. -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  bind:this={root}
  class={['read-notes', { open: status.open }]}
  onpointerleave={leave}
  onfocusout={blur}
  onclick={status.open ? shut : undefined}
>
  <NotesPill
    svg={memo}
    label="Read Note"
    aria-expanded={status.open}
    aria-controls="read-notes-{id}"
    onpointerenter={enter}
    onpointerleave={leave}
    onfocus={focus}
    onclick={(event) => {
      event.stopPropagation();
      send('toggle');
    }}
  />
  <div id="read-notes-{id}" class="sheet" inert={!status.open}>
    <!-- A focus stop, so the keyboard can scroll notes taller than the poster. -->
    <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
    <div class={['text', { fades }]} role="note" aria-label="Notes" tabindex="0" {@attach fade}>
      {#if onedit}
        <Tooltip text="Edit note">
          {#snippet trigger(tooltip)}
            <button type="button" class="edit" aria-label="Edit note" {...tooltip} onclick={editNotes}><Icon
                svg={pen}
              /></button>
          {/snippet}
        </Tooltip>
      {/if}
      <CommentText {blocks} />
    </div>
  </div>
</div>

<style>
/* Clicks pass through to the poster link under it until the notes open; then the poster is the notes' hover area. */
.read-notes {
  position: absolute;
  inset: 0;
  z-index: 10;
  overflow: hidden;
  pointer-events: none;

  &.open {
    pointer-events: auto;
  }
}

/* The pill is hidden while the notes are open; the sheet covers its place. */
.open > :global(.notes-pill) {
  opacity: 0;
  pointer-events: none;
}

.sheet {
  position: absolute;
  inset-inline: 0;
  inset-block-end: 0;
  display: flex;
  flex-direction: column;
  max-block-size: 100%;
  padding: var(--read-notes-sheet-padding);
  border-block-start: 1px solid var(--color-read-notes-border);
  background-color: var(--color-read-notes-sheet);
  backdrop-filter: var(--blur-read-notes-sheet);
  translate: 0 100%;
  transition: translate var(--transition-read-notes);

  .open & {
    translate: 0 0;
  }

  /* The pill is hidden while the notes are open, so the sheet shows its keyboard focus. */
  .read-notes:has(:global(.notes-pill:focus-visible)) & {
    outline: var(--focus-ring-width) solid var(--color-input-border-focus);
    outline-offset: calc(var(--focus-ring-width) * -1);
  }
}

/* Floated, so the notes wrap around it instead of losing a column to it. */
.edit {
  float: inline-end;
  display: grid;
  place-items: center;
  inline-size: var(--read-notes-edit-size);
  block-size: var(--read-notes-edit-size);
  min-block-size: 0;
  margin: var(--read-notes-edit-margin);
  padding: 0;
  border: 1px solid var(--color-read-notes-border);
  border-radius: 50%;
  background-color: var(--color-read-notes-pill-bg);
  color: var(--color-list-edit);
  font-size: var(--font-size-read-notes-edit);
  cursor: pointer;
  transition: background-color var(--transition-read-notes);

  &:hover {
    background-color: var(--color-read-notes-pill-hover);
  }
}

.text {
  min-block-size: 0;
  overflow-y: auto;
  color: var(--color-read-notes-text);
  font-size: var(--font-size-read-notes);
  line-height: var(--line-height-read-notes);
  text-align: start;
  text-shadow: var(--shadow-read-notes-text);
  overflow-wrap: break-word;
  scrollbar-width: thin;
  scrollbar-color: var(--color-read-notes-scrollbar) transparent;

  &.fades {
    mask-image: var(--mask-read-notes-fade);
  }

  & :global(p) {
    margin: 0;
  }

  & :global(p + p) {
    margin-block-start: var(--read-notes-paragraph-gap);
  }
}

@media (prefers-reduced-motion: reduce) {
  .sheet,
  .edit {
    transition: none;
  }
}
</style>
