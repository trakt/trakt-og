import { describe, expect, it } from 'vitest';
import { assertOk } from './assertOk.ts';

describe('api: assertOk', () => {
  it('should let a 200 through', () => {
    expect(() => assertOk({ status: 200 }, 'Season')).not.toThrow();
  });

  it('should throw a 404 for a missing item', () => {
    expect(() => assertOk({ status: 404 }, 'Season')).toThrow(expect.objectContaining({ status: 404 }));
  });

  it('should throw a 503 while the API is down for maintenance', () => {
    expect(() => assertOk({ status: 503 }, 'Season')).toThrow(expect.objectContaining({ status: 503 }));
  });

  it.each([504, 520, 522, 524])('should throw a 504 when the API times out with a %i', (status) => {
    expect(() => assertOk({ status }, 'Season')).toThrow(expect.objectContaining({ status: 504 }));
  });

  it('should throw a 502 for any other status', () => {
    expect(() => assertOk({ status: 500 }, 'Season')).toThrow(
      expect.objectContaining({ status: 502, body: { message: 'The Trakt API could not load this season.' } }),
    );
  });
});
