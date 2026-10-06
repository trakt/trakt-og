import { describe, expect, it } from 'vitest';
import { formatSelection, type TextSelection } from './formatSelection.ts';

// `«` and `»` mark the selection, or `|` the cursor, so each case reads like the textarea.
const parse = (marked: string): TextSelection => {
  const caret = marked.indexOf('|');
  if (caret !== -1) return { text: marked.replace('|', ''), start: caret, end: caret };
  const start = marked.indexOf('«');
  const end = marked.indexOf('»') - 1;
  return { text: marked.replace('«', '').replace('»', ''), start, end };
};
const show = ({ text, start, end }: TextSelection) =>
  start === end
    ? `${text.slice(0, start)}|${text.slice(start)}`
    : `${text.slice(0, start)}«${text.slice(start, end)}»${text.slice(end)}`;

describe('formatSelection', () => {
  describe('for marks around the selection', () => {
    it('should wrap the selection and keep it selected', () => {
      expect(show(formatSelection(parse('a «great» film'), 'bold'))).toBe('a **«great»** film');
      expect(show(formatSelection(parse('a «great» film'), 'italic'))).toBe('a _«great»_ film');
      expect(show(formatSelection(parse('a «great» film'), 'strike'))).toBe('a ~~«great»~~ film');
      expect(show(formatSelection(parse('a «great» film'), 'highlight'))).toBe('a ==«great»== film');
      expect(show(formatSelection(parse('a «great» film'), 'code'))).toBe('a `«great»` film');
      expect(show(formatSelection(parse('he «dies» at the end'), 'spoiler'))).toBe(
        'he [spoiler]«dies»[/spoiler] at the end',
      );
    });

    it('should put the marks in with the cursor between them when nothing is selected', () => {
      expect(show(formatSelection(parse('so |'), 'bold'))).toBe('so **|**');
      expect(show(formatSelection(parse('|'), 'spoiler'))).toBe('[spoiler]|[/spoiler]');
    });

    it('should leave the spaces around a selected word outside the marks', () => {
      expect(show(formatSelection(parse('a« great »film'), 'bold'))).toBe('a **«great»** film');
    });

    it('should take the marks off a selection that already has them', () => {
      expect(show(formatSelection(parse('a **«great»** film'), 'bold'))).toBe('a «great» film');
      expect(show(formatSelection(parse('[spoiler]«dies»[/spoiler]'), 'spoiler'))).toBe('«dies»');
    });
  });

  describe('for line prefixes', () => {
    it('should start every selected line with the prefix and select them', () => {
      expect(show(formatSelection(parse('«one\ntwo»'), 'quote'))).toBe('«> one\n> two»');
      expect(show(formatSelection(parse('«one\ntwo»'), 'list'))).toBe('«- one\n- two»');
    });

    it('should prefix the whole line the cursor is on and keep the cursor in place', () => {
      expect(show(formatSelection(parse('first\nsec|ond'), 'quote'))).toBe('first\n> sec|ond');
      expect(show(formatSelection(parse('|'), 'list'))).toBe('- |');
    });

    it('should leave alone a line the selection only reaches the start of', () => {
      expect(show(formatSelection(parse('«one\n»two'), 'quote'))).toBe('«> one»\ntwo');
    });

    it('should keep blank lines inside a quote and skip them in a list', () => {
      expect(show(formatSelection(parse('«one\n\ntwo»'), 'quote'))).toBe('«> one\n> \n> two»');
      expect(show(formatSelection(parse('«one\n\ntwo»'), 'list'))).toBe('«- one\n\n- two»');
    });

    it('should start a list under a line of text with a blank line, so it renders as a list', () => {
      expect(show(formatSelection(parse('My picks:\n«Heat»'), 'list'))).toBe('My picks:\n\n«- Heat»');
      expect(show(formatSelection(parse('- Heat\n«Ronin»'), 'list'))).toBe('- Heat\n«- Ronin»');
      expect(show(formatSelection(parse('My picks:\n«Heat»'), 'quote'))).toBe('My picks:\n«> Heat»');
    });
  });
});
