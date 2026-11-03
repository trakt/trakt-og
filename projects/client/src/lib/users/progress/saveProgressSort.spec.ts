import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { settingsRequest } from '../../settings/settingsRequest.ts';
import { saveProgressSort } from './saveProgressSort.ts';

const API = 'https://apiz.trakt.tv';
const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const params = () => ({
  request: settingsRequest(
    (...args) => globalThis.fetch(...args),
    () => {},
  ),
  notify: { error: vi.fn() },
});

describe('saveProgressSort', () => {
  it('should save the sort as the watched progress sort', async () => {
    const saved = vi.fn();
    server.use(
      http.put(`${API}/users/settings`, async ({ request }) => {
        saved(await request.json());
        return HttpResponse.json({});
      }),
    );
    const { request, notify } = params();

    expect(await saveProgressSort({ sort: { by: 'episodes', how: 'desc' }, request, notify })).toBe(true);
    expect(saved).toHaveBeenCalledWith({ browsing: { progress: { watched: { sort: 'episodes', sort_how: 'desc' } } } });
    expect(notify.error).not.toHaveBeenCalled();
  });

  it('should not save an old sort name OG still took', async () => {
    const { request, notify } = params();

    expect(await saveProgressSort({ sort: { by: 'most-plays', how: 'desc' }, request, notify })).toBe(false);
    expect(notify.error).not.toHaveBeenCalled();
  });

  it('should show the error when the save fails', async () => {
    server.use(http.put(`${API}/users/settings`, () => new HttpResponse(null, { status: 500 })));
    const { request, notify } = params();

    expect(await saveProgressSort({ sort: { by: 'title', how: 'asc' }, request, notify })).toBe(false);
    expect(notify.error).toHaveBeenCalledWith("Trakt couldn't save your settings. Please try again.");
  });
});
