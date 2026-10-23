<!--
  The popup every "are you sure / when?" prompt opens in: the watch and library dates, rewatch, drop, hide, restore,
  library metadata and the delete and block confirms. It's the dropdown menu's surface with a title bar tinted in
  the action's color (`tone`: purple to watch, teal for the library, red to remove, gray otherwise): the question in
  bold with the close button centered on its first line. The choices are
  `PromptRow`s, `<hr>`s between groups, or a form (`PromptDateForm`, the library metadata). A longer warning goes in
  `note`, between the header and the choices, or in the dialogs' amber notice box as `notice` when it needs the eye
  (a bulk watch's count); a short one belongs on its row as the detail. The caller owns opening it
  (`popovertarget`, or `showPopover()` on the bound `element`) and the focus, as before.
    <PromptPopover id="watch-{id}" anchor="--watch-{id}" title="When did you watch this?" tone="watched"
      bind:element={popover} ontoggle={toggle}>
      <PromptRow svg={check} onclick={() => choose('now')}>Just finished</PromptRow>
    </PromptPopover>
-->
<script lang="ts">
import DialogNotice from '$lib/components/dialog/DialogNotice.svelte';
import type { Snippet } from 'svelte';
import Icon from '$lib/icons/Icon.svelte';
import xmark from '$lib/icons/regular/xmark.svg?raw';

interface Props {
  /** The popover element's id, for the trigger's `aria-controls` or `popovertarget`. */
  id: string;
  /** The trigger's `anchor-name`, with its leading `--`. */
  anchor: string;
  /** The question: text, or markup like a member's name in bold. */
  title: string | Snippet;
  /** `brand` is the Trakt red, for a prompt that isn't an action: the getting-started book. */
  tone?: 'watched' | 'collected' | 'danger' | 'neutral' | 'brand';
  /** A warning too long for its row, between the header and the choices. */
  note?: string;
  /** A warning in the dialogs' amber notice box instead, with markup: a bulk watch's count in bold. */
  notice?: Snippet;
  /** The panel's width: `wide` for the library metadata form. */
  size?: 'default' | 'wide' | 'book';
  /** A caret from the title bar up to the trigger, centred on it however the prompt is placed. */
  arrow?: boolean;
  /** A bar under the choices, for the prompt's own controls. */
  footer?: Snippet;
  element?: HTMLDivElement;
  ontoggle?: (event: ToggleEvent) => void;
  children: Snippet;
}

let {
  id,
  anchor,
  title,
  tone = 'neutral',
  note,
  notice,
  size = 'default',
  arrow = false,
  footer,
  element = $bindable(),
  ontoggle,
  children,
}: Props = $props();
</script>

<div bind:this={element} {id} class={['prompt', tone, size]} popover="auto" role="dialog"
  aria-labelledby="{id}-title" style:position-anchor={anchor} {ontoggle}>
  <header class="head">
    <h3 id="{id}-title">{#if typeof title === 'string'}{title}{:else}{@render title()}{/if}</h3>
    <button type="button" class="close" aria-label="Close" onclick={() => element?.hidePopover()}><Icon
        svg={xmark}
      /></button>
  </header>
  {#if notice}<div class="notice"><DialogNotice>{@render notice()}</DialogNotice></div>
  {:else if note}<p class="note">{note}</p>{/if}
  <div class="body">{@render children()}</div>
  {#if footer}<footer class="foot">{@render footer()}</footer>{/if}
  {#if arrow}<span class="arrow" aria-hidden="true"></span>{/if}
</div>

<style>
.prompt {
  --tone: var(--color-prompt-neutral);
  position: fixed;
  position-area: bottom;
  position-try-fallbacks: flip-block, --prompt-start, --prompt-end;
  inset: auto;
  inline-size: var(--prompt-width);
  max-inline-size: calc(100vw - var(--gutter));
  margin: var(--space-menu-offset) 0;
  padding: 0;
  overflow: hidden;
  border: 1px solid var(--color-menu-border);
  border-radius: var(--radius-menu);
  background-color: var(--color-menu-bg);
  color: var(--color-dropdown-menu-text);
  box-shadow: var(--shadow-menu);
  /* It inherits from where it's placed, which can be a heading or a card's upper-case label. */
  font-family: var(--font-body);
  font-size: var(--font-size-menu);
  font-weight: normal;
  letter-spacing: normal;
  line-height: var(--line-height-base);
  text-align: start;
  text-transform: none;
  white-space: normal;

  &.wide {
    inline-size: var(--prompt-width-wide);
  }

  &.book {
    inline-size: var(--prompt-width-book);
  }

  &.brand {
    --tone: var(--brand-primary);
  }

  &.watched {
    --tone: var(--brand-tertiary);
  }

  &.collected {
    --tone: var(--brand-quaternary);
  }

  &.danger {
    --tone: var(--brand-primary);
  }
}

.head {
  display: flex;
  align-items: flex-start;
  gap: var(--space-prompt-head-gap);
  padding: var(--space-prompt-head);
  border-block-end: 1px solid color-mix(in srgb, var(--tone) var(--prompt-tint-border), var(--color-menu-border));
  background: color-mix(in srgb, var(--tone) var(--prompt-tint), var(--color-menu-bg));
}

h3 {
  flex: 1;
  min-inline-size: 0;
  margin: 0;
  color: var(--color-prompt-title);
  font-family: var(--font-headings);
  font-size: var(--font-size-prompt-title);
  font-weight: var(--font-weight-headings-heavy);
  line-height: var(--line-height-prompt-title);
  text-wrap: balance;
}

/* Centered on the title's first line, so a question that wraps keeps it at the top. */
.close {
  flex: none;
  margin-block: calc((var(--font-size-prompt-title) * var(--line-height-prompt-title) - var(--prompt-close-size)) / 2);
  display: grid;
  place-items: center;
  inline-size: var(--prompt-close-size);
  block-size: var(--prompt-close-size);
  min-block-size: 0;
  margin-inline-end: var(--prompt-close-end);
  padding: 0;
  border: 0;
  border-radius: var(--radius-menu-row);
  background: none;
  color: var(--color-menu-header);
  font-size: var(--font-size-prompt-close);
  cursor: pointer;

  &:is(:hover, :focus-visible) {
    background-color: var(--color-menu-row-hover);
    color: var(--color-menu-row-hover-text);
    outline: none;
  }
}

.note {
  margin: var(--space-menu) var(--space-menu) 0;
  padding: var(--space-menu-row);
  color: var(--color-menu-header);
  font-size: var(--font-size-small);
}

.notice {
  margin: var(--space-menu) var(--space-menu) 0;
}

.body {
  display: grid;
  padding: var(--space-menu);

  & > :global(hr) {
    margin: var(--space-menu) 0;
    border: 0;
    border-block-start: 1px solid var(--color-menu-divider);
  }
}

/* The prompt's footer bar, under the choices. */
.foot {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--space-sm-inline);
  padding: var(--space-prompt-foot);
  border-block-start: 1px solid var(--color-menu-border);
  background: var(--color-prompt-foot-bg);
}

/* A caret on the title bar's top edge, pinned under the trigger's centre through the same anchor. The prompt sets no
   transform, so a fixed child is placed against the viewport and can follow the anchor. */
.arrow {
  position: fixed;
  position-anchor: inherit;
  inset: auto;
  inset-block-start: calc(anchor(bottom) + var(--space-menu-offset) - var(--prompt-arrow) / 2);
  inset-inline-start: calc(anchor(center) - var(--prompt-arrow) / 2);
  inline-size: var(--prompt-arrow);
  block-size: var(--prompt-arrow);
  border-block-start: 1px solid var(--color-menu-border);
  border-inline-start: 1px solid var(--color-menu-border);
  background: color-mix(in srgb, var(--tone) var(--prompt-tint), var(--color-menu-bg));
  rotate: 45deg;
}

@position-try --prompt-start {
  position-area: bottom span-left;
}

@position-try --prompt-end {
  position-area: bottom span-right;
}
</style>
