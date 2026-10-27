import { describe, expect, it } from 'vitest';
import { toCommentSeo } from './toCommentSeo.ts';

const params = {
  comment: { comment: 'A dream within a dream, and it works.', spoiler: false },
  author: 'Justin',
  title: 'Inception (2010)',
  poster: 'https://media.trakt.tv/images/movies/posters/medium/a.jpg.webp',
};

describe('seo: toCommentSeo', () => {
  it("should title the comment by its author and title, with its text and the title's poster", () => {
    expect(toCommentSeo(params)).toEqual({
      title: 'Comment by Justin on Inception (2010)',
      description: 'A dream within a dream, and it works.',
      image: params.poster,
      imageAlt: 'Inception (2010)',
    });
  });

  describe('for spoilers', () => {
    it('should leave a spoiler comment out of the description', () => {
      const seo = toCommentSeo({ ...params, comment: { ...params.comment, spoiler: true } });

      expect(seo.description).toBe('A comment with spoilers about Inception (2010).');
    });

    it('should hide inline spoilers', () => {
      const seo = toCommentSeo({
        ...params,
        comment: { comment: 'Great. [spoiler]The top keeps spinning[/spoiler] Loved it.', spoiler: false },
      });

      expect(seo.description).toBe('Great. [spoiler] Loved it.');
    });
  });

  it('should fall back to a fixed line for a GIF-only comment', () => {
    expect(toCommentSeo({ ...params, comment: { comment: ' ', spoiler: false } }).description).toBe(
      'A comment about Inception (2010).',
    );
  });
});
