import { describe, expect, it, vi } from 'vitest';
import { guardWrites } from './guardWrites.ts';

const ORIGIN = 'https://og.example';
const API = 'https://apiz.example/v3/users/me/notes/1';

function setup() {
  const fetch = vi.fn(() => Promise.resolve(new Response('real')));
  const onblock = vi.fn();
  return { fetch, onblock, guarded: guardWrites({ fetch, origin: ORIGIN, onblock }) };
}

describe('guardWrites', () => {
  it('should let reads through', async () => {
    const { fetch, guarded } = setup();
    await guarded(API);
    expect(fetch).toHaveBeenCalledOnce();
  });

  it('should answer a write to the API itself', async () => {
    const { fetch, onblock, guarded } = setup();
    const response = await guarded(API, { method: 'PUT', body: '{}' });
    expect(fetch).not.toHaveBeenCalled();
    expect(response.status).toBe(204);
    expect(onblock).toHaveBeenCalledWith('PUT', API);
  });

  it('should catch a write sent as a Request', async () => {
    const { fetch, guarded } = setup();
    await guarded(new Request(API, { method: 'DELETE' }));
    expect(fetch).not.toHaveBeenCalled();
  });

  it("should let writes to the site's own routes through", async () => {
    const { fetch, guarded } = setup();
    await guarded(`${ORIGIN}/api/store-token`, { method: 'POST', body: '{}' });
    expect(fetch).toHaveBeenCalledOnce();
  });
});
