<!--
  OG's modal: a rounded panel centered over a dimmed page, with a title bar and a close button in the corner.
  A native modal <dialog>: it moves focus to the first control inside (or the one marked `autofocus`), keeps
  focus inside while open, fades out on Esc and hands focus back to whatever opened it. The page behind doesn't scroll
  while it's open, so menus anchored inside it stay put.
    <Dialog bind:open title="Watch now" lightDismiss>...</Dialog>
  `lightDismiss` also closes it on a backdrop click, like OG's Watch Now modal. Form dialogs stay open.
  `backdrop` blurs an image (the item's fanart) over a black backdrop, like OG's check-in modal.
  `header` replaces the title bar (it gets the id to label the dialog with), and `footer` sits under the panel,
  on the backdrop, like the Watch Now modal's country picker.
-->
<script lang="ts">
import Icon from '$lib/icons/Icon.svelte';
import deleteThick from '$lib/icons/trakt/delete-thick.svg?raw';
import { type Snippet, tick, untrack } from 'svelte';

interface Props {
  open: boolean;
  /** Names the dialog. Only shown when there's no `header`. */
  title: string;
  /**
   * 360px like OG's check-in modal, 440px like its notes modal, 500px, 600px like `.wider`, 690px like Watch Now, or
   * 820px, one more column of Watch Now's tiles.
   */
  size?: 'sm' | 'notes' | 'md' | 'lg' | 'xl' | 'xxl';
  lightDismiss?: boolean;
  /**
   * `art` is the notes, list and report dialogs' look: a thin border, a glass close over a DialogArtHeader, and the
   * toolbar's outlined fields inside; with `size` notes or md it takes their widths.
   */
  variant?: 'art';
  /** Avatar over the top edge, like OG’s new-list modal. */
  avatar?: string;
  backdrop?: string;
  onclose?: () => void;
  /** Gets the id its heading needs, so the dialog stays labelled. */
  header?: Snippet<[string]>;
  footer?: Snippet;
  children: Snippet;
}

let {
  open = $bindable(),
  title,
  size = 'sm',
  lightDismiss = false,
  header,
  footer,
  children,
  avatar,
  backdrop,
  onclose,
  variant,
}: Props = $props();
const id = $props.id();
let dialog = $state<HTMLDialogElement>();
let close = $state<HTMLButtonElement>();
let closing = $state(false);
let pressedBackdrop = false;

// Fades out the way it faded in, then closes. Reduced motion has no transition to wait for.
async function dismiss() {
  if (!dialog?.open || closing) return;
  closing = true;
  await tick();
  await Promise.allSettled(dialog.getAnimations().map(({ finished }) => finished));
  closing = false;
  dialog.close();
}

// Reads `open`, so it re-runs whenever the prop changes.
// A dialog with no controls yet (Watch Now while it loads) would land on Close, so it takes focus itself instead.
const syncOpen = (node: HTMLDialogElement) => {
  if (open && !node.open) {
    node.showModal();
    if (document.activeElement === close) node.focus();
  }
  if (!open && node.open) untrack(() => void dismiss());
};

// Safari has no `closedby`, so a backdrop click is caught here: the press and the release both land on the
// <dialog> itself, outside its panel and footer, so a drag out of a field doesn't close it.
const onpointerdown = (event: PointerEvent) => (pressedBackdrop = event.target === dialog);
const onclick = (event: MouseEvent) => {
  if (lightDismiss && pressedBackdrop && event.target === dialog) void dismiss();
};

// Esc fades out too. Browsers don't let a page cancel repeated Esc presses, which then close at once.
const oncancel = (event: Event) => {
  if (!event.cancelable) return;
  event.preventDefault();
  void dismiss();
};
</script>

<dialog
  bind:this={dialog}
  class={['dialog', size, variant, { 'image-backdrop': backdrop, closing }]}
  aria-labelledby="{id}-title"
  tabindex="-1"
  {onpointerdown}
  {onclick}
  {oncancel}
  onclose={() => { open = false; onclose?.(); }}
  {@attach syncOpen}
>
  {#if backdrop}<div class="backdrop-image" style:background-image={`url("${backdrop}")`}></div>{/if}
  <div class="panel">
    {#if header}
      {@render header(`${id}-title`)}
    {:else}
      <h2 id="{id}-title" class="title">{title}</h2>
    {/if}
    <div class={{ body: !header }}>{@render children()}</div>
    <!-- Last, so opening focuses the first control in the body like OG did. -->
    <button bind:this={close} type="button" class="close" onclick={() => { open = false; onclose?.(); }}>
      <Icon svg={deleteThick} label="Close" />
    </button>
  </div>
  {#if avatar}<img class="avatar" src={avatar} alt="" />{/if}
  {@render footer?.()}
</dialog>

<style>
/* Keeps the scrollbar's space, so the page doesn't shift sideways. */
:global(html:has(dialog:modal)) {
  overflow: hidden;
  scrollbar-gutter: stable;
}

.dialog {
  inline-size: var(--dialog-width);
  max-inline-size: 90%;
  max-block-size: calc(100dvh - 2 * var(--gutter));
  padding: 0;
  overflow: visible;
  border: 0;
  background: none;
  color: var(--color-text);

  /* The panel scrolls rather than the dialog, so its shadow isn't clipped. */
  &[open] {
    display: flex;
    flex-direction: column;
  }

  /* Focused only while it has no controls to hand focus to. */
  &:focus-visible {
    outline: none;
  }

  &::backdrop {
    background-color: var(--color-backdrop);
  }

  &.image-backdrop::backdrop {
    background-color: var(--color-backdrop-image);
  }

  &.notes {
    inline-size: var(--dialog-width-notes);
  }

  &.md {
    inline-size: var(--dialog-width-md);
  }

  &.lg {
    inline-size: var(--dialog-width-lg);
  }

  &.xl {
    inline-size: var(--dialog-width-xl);
  }

  &.xxl {
    inline-size: var(--dialog-width-xxl);
  }

  &.art.notes {
    inline-size: var(--dialog-width-art-notes);
  }

  &.art.md {
    inline-size: var(--dialog-width-art-list);
  }
}

.backdrop-image {
  position: fixed;
  inset: 0;
  z-index: -1;
  background: center / cover;
  filter: var(--blur-dialog-backdrop);
  pointer-events: none;
}

.avatar {
  position: absolute;
  inset-block-start: calc(-1 * var(--list-avatar-size) / 2);
  inset-inline-start: calc(50% - var(--list-avatar-size) / 2);
  inline-size: var(--list-avatar-size);
  block-size: var(--list-avatar-size);
  border: var(--list-avatar-border) solid var(--color-box);
  border-radius: 50%;
  box-shadow: var(--shadow-dialog);
}

.panel {
  position: relative;
  min-block-size: 0;
  overflow-y: auto;
  border-radius: var(--radius-dialog);
  background-color: var(--color-dialog-bg);
  box-shadow: var(--shadow-dialog);
}

@media (prefers-reduced-motion: no-preference) {
  .dialog[open],
  .dialog[open]::backdrop {
    transition: opacity 0.3s linear;

    @starting-style {
      opacity: 0;
    }
  }
}

.dialog.closing,
.dialog.closing::backdrop {
  opacity: 0;
}

.title {
  margin: 0;
  padding: var(--space-panel) var(--space-dialog-inline);
  border-block-end: 1px solid var(--color-dialog-title-border);
  background-color: var(--color-dialog-title-bg);
  color: var(--color-dialog-title-text);
  font-size: var(--font-size-dialog-title);
  font-weight: var(--font-weight-headings);
  text-transform: uppercase;
}

.body {
  padding: var(--space-panel) var(--space-dialog-inline) var(--space-dialog-inline);
}

.close {
  position: absolute;
  inset-block-start: 0;
  inset-inline-end: 0;
  min-block-size: 0;
  padding: var(--space-sm-inline);
  border: 0;
  background: none;
  color: var(--color-dialog-close);

  /* Inside the button, so the panel's rounded corner doesn't clip it. */
  &:focus-visible {
    outline-offset: calc(-1 * var(--focus-ring-width));
  }

  /* A glass circle over the art header's corner. */
  .art & {
    inset-block-start: var(--dialog-art-close-offset);
    inset-inline-end: var(--dialog-art-close-offset);
    z-index: 3;
    display: grid;
    place-items: center;
    inline-size: var(--dialog-art-close-size);
    block-size: var(--dialog-art-close-size);
    padding: 0;
    border: 1px solid var(--color-read-notes-border);
    border-radius: 50%;
    background-color: var(--color-read-notes-pill-bg);
    backdrop-filter: var(--blur-read-notes-pill);
    color: var(--color-card-text);
    font-size: var(--font-size-dialog-art-close);
    /* The Trakt-font X sits high in its box; down to the circle's middle. */
    --icon-shift: var(--quick-icon-trakt-shift);

    &:hover {
      background-color: var(--color-read-notes-pill-hover);
    }

    &:focus-visible {
      outline-offset: 2px;
    }
  }
}

.art .panel {
  border: 1px solid var(--color-dialog-art-border);
}

/* The toolbar's outlined fields. A collaborator picker styles its own search box. */
.art .panel :global(:is(input:not([type='radio'], [type='checkbox']), textarea):not(.multi-select *)) {
  display: block;
  inline-size: 100%;
  padding: var(--dialog-art-field-padding);
  border: 1px solid var(--color-control-border);
  border-radius: var(--radius-control);
  background-color: var(--color-control-bg);
  color: var(--color-control-text);
  font-size: var(--font-size-dialog-art-field);

  &:hover {
    border-color: var(--color-control-border-hover);
  }

  &:focus {
    border-color: var(--color-input-border-focus);
    outline: none;
    box-shadow: var(--shadow-dialog-art-field-focus);
  }

  &::placeholder {
    color: var(--color-dialog-art-placeholder);
  }
}

/* A search field keeps room for its magnifier. */
.art .panel :global(.search-field input:not([type='radio'], [type='checkbox']):not(.multi-select *)) {
  padding-inline-start: var(--space-filter-popover-field-icon);
}

.art .panel :global(:is(input, textarea)[aria-invalid='true']) {
  border-color: var(--brand-danger);
}

.art .panel :global(textarea:not(.multi-select *)) {
  resize: vertical;
  line-height: var(--line-height-base);
}
</style>
