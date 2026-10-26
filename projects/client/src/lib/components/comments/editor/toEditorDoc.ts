import type { JSONContent } from '@tiptap/core';
import type { CommentBlock } from '../text/CommentBlock.ts';
import type { CommentInline } from '../text/CommentInline.ts';

type EditorMark = { readonly type: string; readonly attrs?: Record<string, unknown> };

const MARKS = { strong: 'bold', em: 'italic', del: 'strike', mark: 'highlight', spoiler: 'spoiler' } as const;

const text = (value: string, marks: readonly EditorMark[]): JSONContent[] =>
  value ? [{ type: 'text', text: value, ...(marks.length ? { marks: [...marks] } : {}) }] : [];

function inline(nodes: readonly CommentInline[], marks: readonly EditorMark[] = []): JSONContent[] {
  return nodes.flatMap((node): JSONContent[] => {
    if (node.type === 'text') return text(node.text, marks);
    if (node.type === 'break') return [{ type: 'hardBreak' }];
    // A code mark excludes every other mark, as in the editor's schema.
    if (node.type === 'code') return text(node.text, [{ type: 'code' }]);
    if (node.type === 'mention') return text(`@${node.username}`, marks);
    if (node.type === 'emoji') return text(node.emoji, marks);
    if (node.type === 'link') return inline(node.children, [...marks, { type: 'link', attrs: { href: node.href } }]);
    return inline(node.children, [...marks, { type: MARKS[node.type] }]);
  });
}

const paragraph = (nodes: readonly CommentInline[]): JSONContent => ({ type: 'paragraph', content: inline(nodes) });

function block(item: CommentBlock): JSONContent {
  if (item.type === 'paragraph') {
    return {
      type: 'paragraph',
      ...(item.author ? { attrs: { author: item.author } } : {}),
      content: inline(item.children),
    };
  }
  if (item.type === 'heading') return { type: 'heading', attrs: { level: item.level }, content: inline(item.children) };
  if (item.type === 'quote') return { type: 'blockquote', content: blocks(item.children) };
  if (item.type === 'list') {
    return {
      type: item.ordered ? 'orderedList' : 'bulletList',
      content: item.items.map((nodes) => ({ type: 'listItem', content: [paragraph(nodes)] })),
    };
  }
  if (item.type === 'code') return { type: 'codeBlock', content: text(item.text, []) };
  return { type: 'horizontalRule' };
}

const blocks = (list: readonly CommentBlock[]): JSONContent[] =>
  list.length ? list.map(block) : [{ type: 'paragraph' }];

/** The rich editor's document for a comment's parsed text, so it opens looking the way the comment will post. */
export function toEditorDoc(list: readonly CommentBlock[]): JSONContent {
  return { type: 'doc', content: blocks(list) };
}
