import type { JSONContent } from '@tiptap/core';
import { describe, expect, it } from 'vitest';
import { parseComment } from '../text/parseComment.ts';
import { toCommentMarkdown } from './toCommentMarkdown.ts';
import { toEditorDoc } from './toEditorDoc.ts';

const roundTrip = (text: string) => toCommentMarkdown(toEditorDoc(parseComment(text)));
const paragraph = (...content: JSONContent[]): JSONContent => ({
  type: 'doc',
  content: [{ type: 'paragraph', content }],
});
const text = (value: string, ...marks: string[]): JSONContent => ({
  type: 'text',
  text: value,
  ...(marks.length ? { marks: marks.map((type) => ({ type })) } : {}),
});

describe('toCommentMarkdown', () => {
  describe('for a comment loaded into the editor', () => {
    it.each([
      'A **great** _film_ with ~~bad~~ ==good== bits and `code`.',
      'He [spoiler]dies **at the end**[/spoiler], sadly.',
      '> Say my name.\n>\n> You are Heisenberg.\n\nAgreed.',
      '- one\n- two **bold**\n- three',
      '1. first\n2. second',
      '# Big\n\n### Smaller',
      'Line one\nline two',
      'Code:\n\n    const code = true;\n    done();',
      'Before\n\n---\n\nAfter',
      '~2 An author style paragraph.',
      'See [the trailer](https://www.youtube.com/watch?v=abc) or trakt.tv/movies/heat-1995.',
      '@seanmcd agreed with snake_case names and 5 * 3 = 15.',
      '***bold italic*** and **_mixed_**',
    ])('should render %j the same after the editor', (comment) => {
      expect(parseComment(roundTrip(comment))).toEqual(parseComment(comment));
    });

    it('should keep the syntax as written where it can', () => {
      expect(roundTrip('A **great** _film_ with ==highlights==')).toBe('A **great** _film_ with ==highlights==');
      expect(roundTrip('- one\n- two')).toBe('- one\n- two');
      expect(roundTrip('> quoted')).toBe('> quoted');
    });

    it('should write an emoji code as its emoji', () => {
      expect(roundTrip('So good :fire:')).toBe('So good 🔥');
    });
  });

  describe('for text typed in the editor', () => {
    it('should escape what would read as formatting', () => {
      expect(toCommentMarkdown(paragraph(text('use **stars** here')))).toBe('use \\*\\*stars\\*\\* here');
      expect(parseComment(toCommentMarkdown(paragraph(text('use **stars** here'))))).toEqual(
        parseComment('use \\*\\*stars\\*\\* here'),
      );
    });

    it('should escape the start of a line that would start a block', () => {
      expect(toCommentMarkdown(paragraph(text('# not a heading')))).toBe('\\# not a heading');
      expect(toCommentMarkdown(paragraph(text('- not a list')))).toBe('\\- not a list');
      expect(toCommentMarkdown(paragraph(text('1. not a list')))).toBe('1\\. not a list');
      expect(toCommentMarkdown(paragraph(text('> not a quote')))).toBe('\\> not a quote');
    });

    it('should keep spaces outside the marks so the emphasis still counts', () => {
      expect(toCommentMarkdown(paragraph(text('so '), text('bold ', 'bold'), text('here')))).toBe('so **bold** here');
    });

    it('should nest a spoiler outside emphasis', () => {
      expect(toCommentMarkdown(paragraph(text('a ', 'spoiler', 'bold'), text('b', 'spoiler')))).toBe(
        '[spoiler]**a** b[/spoiler]',
      );
    });

    it('should fence code that has backticks in it', () => {
      expect(toCommentMarkdown(paragraph(text('a `b`', 'code')))).toBe('`` a `b` ``');
    });

    it('should leave out empty paragraphs', () => {
      const doc: JSONContent = {
        type: 'doc',
        content: [
          { type: 'paragraph', content: [text('one')] },
          { type: 'paragraph' },
          { type: 'paragraph', content: [text('two')] },
        ],
      };
      expect(toCommentMarkdown(doc)).toBe('one\n\ntwo');
    });
  });
});
