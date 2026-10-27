import { describe, expect, it } from 'vitest';
import { checkMissing } from './checkMissing.ts';

const response = (status: number, body: string) => ({ status, headers: new Headers(), body });

describe('checkMissing', () => {
  it('should pass a 404 with one title and a noindex tag', () => {
    const body =
      '<html><head><title>Not found - Trakt OG Redux</title><meta name="robots" content="noindex, follow"></head></html>';

    expect(checkMissing(response(404, body)).every((check) => check.pass)).toBe(true);
  });

  it('should fail a soft 404 that answers 200', () => {
    expect(checkMissing(response(200, '<html><head><title>Movie</title></head></html>'))).toEqual([
      { group: '404', label: 'made-up item answers 404', pass: false, detail: 'got 200' },
    ]);
  });

  it('should fail an error page without its own title or with an index tag', () => {
    const body = '<html><head><meta name="robots" content="index, follow"></head></html>';

    expect(
      checkMissing(response(404, body))
        .filter((check) => !check.pass)
        .map((check) => check.label),
    ).toEqual(['404 page has one <title>', '404 page is noindex']);
  });
});
