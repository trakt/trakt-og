import { describe, expect, it } from 'vitest';
import { toSeoDescription } from './toSeoDescription.ts';

describe('seo: toSeoDescription', () => {
  it('should keep short text as it is', () => {
    expect(toSeoDescription('A thief who steals corporate secrets.')).toBe('A thief who steals corporate secrets.');
  });

  it('should collapse whitespace and trim', () => {
    expect(toSeoDescription('  Two\n\nlines   here ')).toBe('Two lines here');
  });

  it('should keep a Markdown link text and drop its URL', () => {
    expect(toSeoDescription('Known for [Big](/movies/big-1988) and [Taxi](https://trakt.tv/shows/taxi).')).toBe(
      'Known for Big and Taxi.',
    );
  });

  it('should drop the italics around a linked title, but keep a title holding a star', () => {
    expect(
      toSeoDescription(
        'In [*Wicked*](https://app.trakt.tv/movies/wicked-2024) and [M*A*S*H](https://app.trakt.tv/shows/m-a-s-h).',
      ),
    ).toBe('In Wicked and M*A*S*H.');
  });

  it('should drop bare URLs, HTML tags and Markdown emphasis', () => {
    expect(toSeoDescription('# Hi\n**Bold** <b>tag</b> `code` see https://example.com/x now')).toBe(
      'Hi Bold tag code see now',
    );
  });

  it('should cut long text at a word, with an ellipsis, within 160 characters', () => {
    const result = toSeoDescription('word '.repeat(60));

    expect(result.length).toBeLessThanOrEqual(160);
    expect(result).toMatch(/ word…$/);
  });

  it('should drop punctuation before the ellipsis', () => {
    expect(toSeoDescription(`${'a'.repeat(100)} ${'b'.repeat(40)}, ${'c'.repeat(40)}`)).toBe(
      `${'a'.repeat(100)} ${'b'.repeat(40)}…`,
    );
  });

  it('should be empty for missing text', () => {
    expect(toSeoDescription(null)).toBe('');
    expect(toSeoDescription(undefined)).toBe('');
  });
});
