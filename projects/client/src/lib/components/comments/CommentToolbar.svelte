<!--
  The comment composer's formatting toolbar: bold, italic, strikethrough and highlight, then spoiler, list, quote and
  code. Each button says what it does in a tooltip under it. It's one tab stop, and the arrow keys, Home and End move
  along it. A mouse press keeps the focus and the selection in the textarea, so the composer can format what's picked.
-->
<script lang="ts">
import Icon from '$lib/icons/Icon.svelte';
import bold from '$lib/icons/solid/bold.svg?raw';
import code from '$lib/icons/solid/code.svg?raw';
import eyeSlash from '$lib/icons/solid/eye-slash.svg?raw';
import highlighter from '$lib/icons/solid/highlighter.svg?raw';
import italic from '$lib/icons/solid/italic.svg?raw';
import listUl from '$lib/icons/solid/list-ul.svg?raw';
import quoteLeft from '$lib/icons/solid/quote-left.svg?raw';
import strikethrough from '$lib/icons/solid/strikethrough.svg?raw';
import Tooltip from '../tooltip/Tooltip.svelte';
import type { CommentFormat } from './formatSelection.ts';

const { onformat }: { onformat: (format: CommentFormat) => void } = $props();

const groups: readonly (readonly { format: CommentFormat; label: string; svg: string }[])[] = [
  [
    { format: 'bold', label: 'Bold', svg: bold },
    { format: 'italic', label: 'Italic', svg: italic },
    { format: 'strike', label: 'Strikethrough', svg: strikethrough },
    { format: 'highlight', label: 'Highlight', svg: highlighter },
  ],
  [
    { format: 'spoiler', label: 'Spoiler', svg: eyeSlash },
    { format: 'list', label: 'List', svg: listUl },
    { format: 'quote', label: 'Quote', svg: quoteLeft },
    { format: 'code', label: 'Code', svg: code },
  ],
];
const formats = groups.flat().map(({ format }) => format);

// The button the toolbar's tab stop is on.
let current = $state<CommentFormat>('bold');

const keys: Record<string, (index: number) => number> = {
  ArrowRight: (index) => (index + 1) % formats.length,
  ArrowLeft: (index) => (index - 1 + formats.length) % formats.length,
  Home: () => 0,
  End: () => formats.length - 1,
};

function move(event: KeyboardEvent & { currentTarget: HTMLElement }) {
  const next = keys[event.key];
  if (!next) return;
  event.preventDefault();
  current = formats.at(next(formats.indexOf(current))) ?? current;
  event.currentTarget.querySelector<HTMLButtonElement>(`[data-format="${current}"]`)?.focus();
}
</script>

<div class="toolbar" role="toolbar" aria-label="Formatting" tabindex="-1" onkeydown={move}>
  {#each groups as group, index (index)}
    {#if index > 0}<span class="separator" aria-hidden="true"></span>{/if}
    {#each group as { format, label, svg } (format)}
      <Tooltip text={label} placement="bottom">
        {#snippet trigger(tooltip)}
          <button
            type="button"
            data-format={format}
            aria-label={label}
            tabindex={format === current ? 0 : -1}
            onmousedown={(event) => event.preventDefault()}
            onfocus={() => (current = format)}
            onclick={() => onformat(format)}
            {...tooltip}
          >
            <Icon {svg} />
          </button>
        {/snippet}
      </Tooltip>
    {/each}
  {/each}
</div>

<style>
.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: var(--comment-toolbar-gap);
  margin-inline-end: auto;
}

button {
  display: inline-grid;
  place-items: center;
  min-inline-size: var(--comment-toolbar-button);
  min-block-size: var(--comment-toolbar-button);
  padding: var(--comment-toolbar-button-padding);
  border: 0;
  border-radius: var(--radius-comment-toolbar-button);
  background: none;
  color: var(--color-comment-muted);
  font-size: var(--font-size-comment-toolbar);
  cursor: pointer;
  transition: background-color var(--transition-comment-quiet), color var(--transition-comment-quiet);

  &:hover {
    background-color: var(--color-comment-chip);
    color: var(--color-text);
  }
}

.separator {
  inline-size: 1px;
  margin: var(--comment-toolbar-separator-margin);
  background-color: var(--color-comment-rail);
}

@media (prefers-reduced-motion: reduce) {
  button {
    transition: none;
  }
}
</style>
