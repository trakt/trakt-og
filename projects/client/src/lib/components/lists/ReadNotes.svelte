<!--
  The owner's notes on a list poster: a glass "Read Note" pill centred over the poster's bottom, and a glass sheet that
  slides up the poster with the notes. Hovering or focusing the pill opens it, a click or tap pins it open, and Esc, a
  click elsewhere or the pointer leaving the poster shuts it. Notes taller than the poster scroll inside it, the bottom
  edge fading until the end. For the list's editors (`onedit` and `ondelete`), the open notes take over the quick-icon
  bar under the poster too: the edit and delete icons centered in it like manage mode's, delete asking first, so the
  notes keep the poster's full width. It draws the card's border over the one it covers. Place it over the poster
  (PosterCard's `posterOverlay`).
    <ReadNotes notes="Watch the director's cut:fire:" onedit={canEdit ? openNotesDialog : undefined}
      ondelete={canEdit ? clearNotes : undefined} />
-->
<script lang="ts">
import type { Attachment } from 'svelte/attachments';
import CommentText from '$lib/components/comments/CommentText.svelte';
import NoteManage from '$lib/components/notes/NoteManage.svelte';
import { parseComment } from '$lib/components/comments/text/parseComment';
import { type TooltipEvent, type TooltipState, tooltipState } from '$lib/components/tooltip/tooltipState';
import memo from '$lib/icons/solid/memo.svg?raw';
import NotesPill from './NotesPill.svelte';
import { scrollsBelow } from './scrollsBelow.ts';

interface Props {
  notes: string;
  /** Someone who can edit the list: the note bar's pencil opens the notes for editing. */
  onedit?: () => void;
  /** With `onedit`: the note bar's delete clears the notes, after asking. */
  ondelete?: () => void;
}

const { notes, onedit, ondelete }: Props = $props();
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

const editNotes = () => {
  send('dismiss');
  onedit?.();
};

const deleteNotes = () => {
  send('dismiss');
  ondelete?.();
};

// The note bar covers the poster card's quick icons, the element after the poster, so it takes their height.
const below: Attachment<HTMLElement> = (node) => {
  const icons = node.parentElement?.nextElementSibling;
  if (!(icons instanceof HTMLElement) || !icons.matches('.quick-icons')) return;
  const observer = new ResizeObserver(() => node.style.setProperty('--read-notes-below', `${icons.offsetHeight}px`));
  observer.observe(icons);
  return () => observer.disconnect();
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
  class={['read-notes', { open: status.open, managed: onedit }]}
  {@attach onedit ? below : undefined}
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
      <CommentText {blocks} />
    </div>
  </div>
  {#if onedit}
    <!-- Clicks here are the icons' own, not the poster's click that shuts the notes. -->
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="note-bar" inert={!status.open} onclick={(event) => event.stopPropagation()}>
      <NoteManage onedit={editNotes} ondelete={deleteNotes} />
    </div>
  {/if}
</div>

<style>
/* Clicks pass through to the poster link under it until the notes open; then the poster is the notes' hover area. */
.read-notes {
  position: absolute;
  inset: 0;
  z-index: 10;
  overflow: hidden;
  border: var(--card-border-width, 1px) solid var(--color-card-border);
  pointer-events: none;

  &.open {
    pointer-events: auto;
  }

  /* The quick icons carry on under a reader's sheet, so there's no edge to draw there. */
  &:not(.managed) {
    border-block-end: 0;
  }

  :global(.framed) & {
    border-start-start-radius: var(--radius-card-framed);
    border-start-end-radius: var(--radius-card-framed);
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

/*
  For the list's editors the notes reach down over the quick icons (`--read-notes-below`, their height), where the
  note bar slides up with the sheet. Shut, the sheet waits below the bar as well as the poster.
*/
.managed {
  --bar: max(var(--read-notes-below, 0px), var(--read-notes-bar-min));
  inset-block-end: calc(-1 * var(--read-notes-below, 0px));

  :global(.framed) & {
    border-end-start-radius: var(--radius-card-framed);
    border-end-end-radius: var(--radius-card-framed);
  }

  & > :global(.notes-pill) {
    inset-block-end: calc(var(--read-notes-pill-bottom) + var(--read-notes-below, 0px));
  }

  & .sheet {
    inset-block-end: var(--bar);
    translate: 0 calc(100% + var(--bar));
  }

  &.open .sheet {
    translate: 0 0;
  }
}

.note-bar {
  position: absolute;
  inset-inline: 0;
  inset-block-end: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  block-size: var(--bar);
  padding-inline: var(--list-edit-bar-padding);
  border-block-start: 1px solid var(--color-read-notes-border);
  background-color: var(--color-read-notes-bar);
  backdrop-filter: var(--blur-read-notes-sheet);
  translate: 0 100%;
  transition: translate var(--transition-read-notes);

  .open > & {
    translate: 0 0;
  }

  & :global(.note-manage) {
    gap: var(--list-edit-centered-gap);
  }

  /* Manage mode's round icons. */
  & :global(:is(.edit, .confirm.delete > button)) {
    inline-size: var(--list-edit-button-size);
    block-size: var(--list-edit-button-size);
    border-radius: 50%;
    font-size: var(--font-size-list-edit);
  }

  & :global(:is(.edit, .confirm.delete > button):hover) {
    background-color: var(--color-list-edit-button-hover);
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
  .note-bar {
    transition: none;
  }
}
</style>
