import { describe, expect, it, vi } from 'vitest';
import { deleteSmartList } from './deleteSmartList.ts';

describe('util: deleteSmartList', () => {
  it("should delete the viewer's list by its slug", async () => {
    const request = vi.fn(async () => new Response(null, { status: 204 }));
    await expect(deleteSmartList({ request, slug: 'hbo-dramas-1a2b' })).resolves.toBe(true);
    expect(request).toHaveBeenCalledWith('/users/me/smart-lists/hbo-dramas-1a2b', 'DELETE');
  });

  it('should count a list that is already gone as deleted', async () => {
    await expect(
      deleteSmartList({ request: async () => new Response(null, { status: 404 }), slug: 'gone' }),
    ).resolves.toBe(true);
  });

  it('should fail on an error', async () => {
    await expect(
      deleteSmartList({ request: async () => new Response(null, { status: 500 }), slug: 'x' }),
    ).resolves.toBe(false);
  });
});
