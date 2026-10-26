import type { JSONContent } from '@tiptap/core';
import { parseSpans } from '../text/parseSpans.ts';
import { safeLink } from '../text/safeLink.ts';

// Outermost first. OG swaps the spoiler tags out before anything else, so a spoiler can't sit inside a link or emphasis.
const ORDER = ['spoiler', 'link', 'bold', 'italic', 'strike', 'highlight'] as const;
type WrapMark = (typeof ORDER)[number];

const DELIMITERS: Record<Exclude<WrapMark, 'spoiler' | 'link'>, string> = {
  bold: '**',
  italic: '_',
  strike: '~~',
  highlight: '==',
};

const SYNTAX = /[\\`*_~=[]/g;
const FORMATTING = new Set(['strong', 'em', 'del', 'mark', 'code']);
// What would start a block, a list item, an author style or a heading underline at the start of a line.
const LINE_START = /^(?:[#>]|[-+*] |\d+\. |~[1-6]|(?:[-*_] *){3,}$|=+ *$|-+ *$)/;

const markOf = (node: JSONContent, type: string) => node.marks?.find((mark) => mark.type === type);

// Typed characters that the comment syntax would read as formatting get escaped; anything else stays as typed.
function escape(value: string): string {
  const spans = parseSpans(value);
  const plain = spans.map((span) => (span.type === 'text' ? span.text : '')).join('');
  const formatted = spans.some((span) => FORMATTING.has(span.type));
  const consumed = spans.every((span) => span.type === 'text') && plain !== value;
  return formatted || consumed ? value.replace(SYNTAX, '\\$&') : value;
}

function code(value: string): string {
  const longest = Math.max(0, ...(value.match(/`+/g) ?? []).map((run) => run.length));
  const fence = '`'.repeat(longest + 1);
  return longest ? `${fence} ${value} ${fence}` : `${fence}${value}${fence}`;
}

function leaf(node: JSONContent): string {
  if (node.type === 'hardBreak') return '\n';
  const value = node.text ?? '';
  return markOf(node, 'code') ? code(value) : escape(value);
}

// Emphasis only counts with no space just inside its marks, so the spaces move outside.
function hug(open: string, inner: string, close: string): string {
  const [, lead = '', core = '', trail = ''] = /^(\s*)([\s\S]*?)(\s*)$/.exec(inner) ?? [];
  return core ? `${lead}${open}${core}${close}${trail}` : inner;
}

function wrap(type: WrapMark, nodes: readonly JSONContent[], inner: string): string {
  if (type === 'spoiler') return `[spoiler]${inner}[/spoiler]`;
  if (type === 'link') {
    const href = String(markOf(nodes[0] ?? {}, 'link')?.attrs?.href ?? '');
    return safeLink(inner)?.href === href ? inner : `[${inner}](${href})`;
  }
  const delimiter = DELIMITERS[type];
  return hug(delimiter, inner, delimiter);
}

// Each mark wraps the longest run of neighbors that share it (a link, the same href), outermost mark first.
function key(node: JSONContent, type: WrapMark): string | undefined {
  const mark = markOf(node, type);
  if (!mark) return undefined;
  return type === 'link' ? String(mark.attrs?.href ?? '') : type;
}

function runs(nodes: readonly JSONContent[], type: WrapMark): JSONContent[][] {
  return nodes.reduce<JSONContent[][]>((groups, node) => {
    const last = groups.at(-1);
    const previous = last?.at(-1);
    if (last && previous && key(previous, type) === key(node, type)) last.push(node);
    else groups.push([node]);
    return groups;
  }, []);
}

function inline(nodes: readonly JSONContent[], depth = 0): string {
  const type = ORDER[depth];
  if (!type) return nodes.map(leaf).join('');
  return runs(nodes, type)
    .map((run) => {
      const inner = inline(run, depth + 1);
      return key(run[0] ?? {}, type) === undefined ? inner : wrap(type, run, inner);
    })
    .join('');
}

// A digit isn't escapable, so a numbered line escapes its dot instead.
function escapeLine(line: string): string {
  const [, indent = '', rest = ''] = /^(\s*)([\s\S]*)$/.exec(line) ?? [];
  if (!LINE_START.test(rest)) return line;
  return indent + (/^\d/.test(rest) ? rest.replace('.', '\\.') : `\\${rest}`);
}

const escapeLines = (value: string) => value.split('\n').map(escapeLine).join('\n');

// A block's first line can't start indented, or four spaces would make it code.
const lines = (value: string) => escapeLines(value.trimStart());

const textOf = (node: JSONContent) => lines(inline(node.content ?? []));

// og's comments have no nested lists, so a nested list's items follow its parent's.
function itemTexts(list: JSONContent): string[] {
  return (list.content ?? []).flatMap((item) => {
    const children = item.content ?? [];
    const own = children
      .filter((child) => child.type === 'paragraph')
      .map(textOf)
      .join('\n');
    return [own, ...children.filter((child) => child.type?.endsWith('List')).flatMap(itemTexts)];
  });
}

const listItems = (list: JSONContent) =>
  itemTexts(list).map((item, index) => {
    const marker = list.type === 'orderedList' ? `${index + 1}.` : '-';
    return `${marker} ${item.replaceAll('\n', '\n  ')}`;
  });

function block(node: JSONContent): string {
  if (node.type === 'paragraph') {
    const author = Number(node.attrs?.author ?? 0);
    return author ? `~${author}${escapeLines(inline(node.content ?? []))}` : textOf(node);
  }
  if (node.type === 'heading') {
    const text = textOf(node).replaceAll('\n', ' ').trim();
    return text ? `${'#'.repeat(Number(node.attrs?.level ?? 1))} ${text}` : '';
  }
  if (node.type === 'blockquote') {
    const inner = blocks(node.content ?? []);
    return inner
      ? inner
          .split('\n')
          .map((line) => (line ? `> ${line}` : '>'))
          .join('\n')
      : '';
  }
  if (node.type === 'bulletList' || node.type === 'orderedList') return listItems(node).join('\n');
  if (node.type === 'codeBlock') {
    const text = (node.content ?? []).map((child) => child.text ?? '').join('');
    return text.trim()
      ? text
          .split('\n')
          .map((line) => `    ${line}`)
          .join('\n')
      : '';
  }
  if (node.type === 'horizontalRule') return '---';
  return '';
}

const blocks = (nodes: readonly JSONContent[]): string =>
  nodes
    .map(block)
    .filter((text) => text.trim())
    .join('\n\n');

/**
 * The comment syntax `parseComment` reads, for the rich editor's document: OG's Redcarpet markdown with `==highlight==`,
 * `[spoiler]` tags and `~1` author styles. Typed characters the syntax would read as formatting come back escaped.
 */
export function toCommentMarkdown(doc: JSONContent): string {
  return blocks(doc.content ?? []);
}
