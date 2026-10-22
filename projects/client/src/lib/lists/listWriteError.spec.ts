import { describe, expect, it } from 'vitest';
import { listWriteError } from './listWriteError.ts';

const GENERIC = 'Doh! We ran into some sort of error.';

describe('listWriteError', () => {
  it("should read the API's message", async () => {
    expect(await listWriteError(Response.json({ message: 'List limit reached' }, { status: 420 }))).toBe(
      'List limit reached',
    );
  });

  it('should fall back to the generic toast without a message', async () => {
    expect(await listWriteError(Response.json({}, { status: 500 }))).toBe(GENERIC);
    expect(await listWriteError(new Response('oops', { status: 502 }))).toBe(GENERIC);
  });

  it('should fall back to the generic toast without a response', async () => {
    expect(await listWriteError()).toBe(GENERIC);
  });
});
