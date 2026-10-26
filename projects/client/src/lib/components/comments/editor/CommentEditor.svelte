<!--
  The composer's rich field: the comment as it will look, edited in place with Tiptap, which loads when the field first
  opens. It starts from `text` (the comment syntax) and hands back the syntax on each change; until the member changes
  something, the composer keeps the text it started with, so editing an old comment doesn't rewrite its marks.
    <CommentEditor text={draft} label="Your reply" placeholder="Reply to Sean..." onchange={(next) => (text = next)}
      onsubmit={() => form.requestSubmit()} />
-->
<script lang="ts">
import type { Editor } from '@tiptap/core';
import { untrack } from 'svelte';
import type { CommentFormat } from '../formatSelection.ts';
import { parseComment } from '../text/parseComment.ts';
import { createCommentEditor } from './createCommentEditor.ts';
import { toCommentMarkdown } from './toCommentMarkdown.ts';
import { toEditorDoc } from './toEditorDoc.ts';

interface Props {
  /** What the field starts with, in the comment syntax. */
  text: string;
  label: string;
  placeholder: string;
  describedBy?: string;
  onchange: (text: string) => void;
  onsubmit: () => void;
}

const { text, label, placeholder, describedBy, onchange, onsubmit }: Props = $props();

let editor = $state.raw<Editor>();

const commands: Record<CommentFormat, (editor: Editor) => boolean> = {
  bold: (current) => current.chain().focus().toggleBold().run(),
  italic: (current) => current.chain().focus().toggleItalic().run(),
  strike: (current) => current.chain().focus().toggleStrike().run(),
  highlight: (current) => current.chain().focus().toggleHighlight().run(),
  spoiler: (current) => current.chain().focus().toggleSpoiler().run(),
  list: (current) => current.chain().focus().toggleBulletList().run(),
  quote: (current) => current.chain().focus().toggleBlockquote().run(),
  code: (current) => current.chain().focus().toggleCode().run(),
};

/** A toolbar button, on the selection. */
export function format(kind: CommentFormat) {
  if (editor) commands[kind](editor);
}

export function focus() {
  editor?.commands.focus(null, { scrollIntoView: false });
}

// Created once per mount: the composer mounts a fresh field each time it switches back from markdown.
const mount = (element: HTMLElement) =>
  untrack(() => {
    let gone = false;
    const created = createCommentEditor({
      element,
      content: toEditorDoc(parseComment(text)),
      label,
      placeholder,
      describedBy,
      onupdate: (current) => onchange(toCommentMarkdown(current.getJSON())),
      onsubmit,
    }).then((made) => {
      if (gone) made.destroy();
      else editor = made;
      return made;
    });
    return () => {
      gone = true;
      void created.then((made) => made.destroy());
    };
  });
</script>

<div class="editor" {@attach mount}></div>

<style>
/* The rendered look of `CommentText`, at the textarea's size and padding. */
.editor :global {
  .tiptap {
    min-block-size: var(--comment-field-height);
    padding: var(--comment-field-padding);
    color: var(--color-text);
    font-family: var(--font-body);
    overflow-wrap: break-word;
    white-space: pre-wrap;

    /* The field's border shows the focus. */
    &:focus {
      outline: 0;
    }

    & * {
      font-size: inherit;
    }
  }

  p {
    margin: 0 0 calc(var(--line-height-computed) / 2);

    &:last-child {
      margin-block-end: 0;
    }
  }

  .is-editor-empty:first-child::before {
    content: attr(data-placeholder);
    float: inline-start;
    block-size: 0;
    color: var(--color-comment-muted);
    pointer-events: none;
  }

  .author {
    margin: 0 0 15px;
    padding: 7px 0 7px 15px;
    border-inline-start: 2px solid var(--color-comment-author);
  }

  .author-1 {
    border-inline-start-color: var(--brand-primary);
  }

  .author-2 {
    border-inline-start-color: var(--brand-secondary);
  }

  .author-3 {
    border-inline-start-color: var(--brand-tertiary);
  }

  .author-4 {
    border-inline-start-color: var(--brand-quaternary);
  }

  .author-5 {
    border-inline-start-color: var(--brand-fifth);
  }

  .author-6 {
    border-inline-start-color: var(--brand-sixth);
  }

  :is(h1, h2, h3, h4, h5, h6) {
    margin: var(--gutter) 0 var(--space-lg-block);
    border-block-end: 1px solid var(--color-comment-rule);
    font-family: var(--font-headings);
    font-weight: var(--font-weight-headings);
    line-height: var(--line-height-headings);

    &:first-child {
      margin-block-start: 0;
    }
  }

  h1 {
    font-size: 160%;
  }

  h2 {
    font-size: 140%;
  }

  h3 {
    font-size: 130%;
  }

  h4 {
    font-size: 120%;
  }

  h5 {
    font-size: 110%;
  }

  h6 {
    font-size: 100%;
  }

  blockquote {
    margin: 0 0 var(--gutter);
    padding: var(--space-lg-block) 15px;
    border-inline-start: 5px solid var(--color-comment-quote-border);
    background-color: var(--color-comment-quote-bg);

    &:last-child {
      margin-block-end: 0;
    }
  }

  ul,
  ol {
    margin: 0 0 calc(var(--line-height-computed) / 2);

    &:last-child {
      margin-block-end: 0;
    }
  }

  li p {
    margin: 0;
  }

  pre {
    margin: 0 0 calc(var(--line-height-computed) / 2);
    padding: 9.5px;
    background-color: var(--color-comment-quote-bg);
    color: var(--color-comment-pre-text);
    line-height: var(--line-height-base);

    & code {
      padding: 0;
      border: 0;
      background: none;
      color: inherit;
    }
  }

  hr {
    border-block-start-color: var(--color-comment-rule);
  }

  mark {
    padding: 2px 4px;
    border-radius: var(--radius-code);
    background-color: var(--color-comment-mark-bg);
    color: var(--color-comment-mark-text);
  }

  /* Readable while it's written: outlined and hatched where a posted spoiler blurs, each line on its own. */
  .spoiler {
    padding: var(--comment-editor-spoiler-padding);
    border: 1px dashed var(--color-comment-editor-spoiler-border);
    border-radius: var(--radius-code);
    background: repeating-linear-gradient(
      -45deg,
      transparent 0 var(--comment-editor-spoiler-stripe),
      var(--color-comment-editor-spoiler-stripe) var(--comment-editor-spoiler-stripe)
        calc(var(--comment-editor-spoiler-stripe) * 2)
    );
    box-decoration-break: clone;
  }

  a {
    text-decoration: none;
  }
}
</style>
