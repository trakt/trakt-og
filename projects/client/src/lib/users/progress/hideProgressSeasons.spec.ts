import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { rawApiFetch } from '../../api/rawApiFetch.ts';
import { createOverlay } from '../../overlay/createOverlay.svelte.ts';
import type { HiddenProgress } from '../../overlay/HiddenProgress.ts';
import { hideProgressSeasons } from './hideProgressSeasons.ts';

const API = 'https://apiz.trakt.tv';
const AT = '2026-11-04T12:00:00.000Z';
const show = { id: 1, title: 'The Bold and the Beautiful' };
const empty: HiddenProgress = { shows: new Set(), seasons: new Map() };
const server = setupServer();
beforeAll(() => server.listen({ onUnhandledFrame: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

async function setup(hiddenSeasons: readonly number[] = []) {
  const watched: HiddenProgress = {
    shows: new Set(),
    seasons: new Map(hiddenSeasons.length > 0 ? [[show.id, new Set(hiddenSeasons)]] : []),
  };
  const overlay = createOverlay({
    get: () => Promise.resolve(new Response(null, { status: 503 })),
    storage: {
      clearExcept: () => Promise.resolve(),
      save: () => Promise.resolve(),
      load: () => Promise.resolve([{ name: 'progressHidden', activity: '', data: { watched, collected: empty } }]),
    },
  });
  await overlay.start('tester');
  return {
    overlay,
    notify: { success: vi.fn(), error: vi.fn() },
    now: () => new Date(AT),
    request: (path: string, body: unknown) =>
      rawApiFetch({
        path,
        init: { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) },
      }),
  };
}

const hiddenOf = (overlay: Awaited<ReturnType<typeof setup>>['overlay']) => [
  ...(overlay.slices().progressHidden?.watched.seasons.get(show.id) ?? []),
];

describe('hideProgressSeasons', () => {
  it('should hide the seasons at once, post them through the show, and offer Undo', async () => {
    const params = await setup([9]);
    let body: unknown;
    server.use(
      http.post(`${API}/users/hidden/progress_watched`, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ added: { seasons: 2 } }, { status: 201 });
      }),
    );

    const saving = hideProgressSeasons({ ...params, show, seasons: [4, 5], hide: true });
    expect(hiddenOf(params.overlay)).toEqual([9, 4, 5]);

    expect(await saving).toBe(true);
    expect(body).toEqual({
      shows: [
        {
          ids: { trakt: 1 },
          seasons: [
            { number: 4, hidden_at: AT },
            { number: 5, hidden_at: AT },
          ],
        },
      ],
    });
    expect(params.notify.success).toHaveBeenCalledWith('You hid 2 seasons of The Bold and the Beautiful.', {
      label: 'Undo',
      run: expect.any(Function),
    });
  });

  it('should unhide through the remove route, and Undo should unhide what it hid', async () => {
    const params = await setup();
    const removed: unknown[] = [];
    server.use(
      http.post(`${API}/users/hidden/progress_watched`, () =>
        HttpResponse.json({ added: { seasons: 1 } }, { status: 201 }),
      ),
      http.post(`${API}/users/hidden/progress_watched/remove`, async ({ request }) => {
        removed.push(await request.json());
        return HttpResponse.json({ deleted: { seasons: 1 } });
      }),
    );

    await hideProgressSeasons({ ...params, show, seasons: [3], hide: true });
    const [, action] = params.notify.success.mock.calls[0] ?? [];
    action.run();
    await vi.waitFor(() => expect(params.notify.success).toHaveBeenCalledTimes(2));

    expect(removed).toEqual([{ shows: [{ ids: { trakt: 1 }, seasons: [{ number: 3 }] }] }]);
    expect(hiddenOf(params.overlay)).toEqual([]);
    expect(params.notify.success).toHaveBeenLastCalledWith(
      'Season 3 of The Bold and the Beautiful is back on your progress.',
    );
  });

  it('should roll back and say so when the API rejects or changes nothing', async () => {
    const params = await setup([9]);
    server.use(
      http.post(`${API}/users/hidden/progress_watched/remove`, () => HttpResponse.json({ deleted: { seasons: 0 } })),
    );

    expect(await hideProgressSeasons({ ...params, show, seasons: [9], hide: false })).toBe(false);
    expect(hiddenOf(params.overlay)).toEqual([9]);
    expect(params.notify.error).toHaveBeenCalledOnce();
    expect(params.notify.success).not.toHaveBeenCalled();
  });

  it('should do nothing without seasons', async () => {
    const params = await setup();

    expect(await hideProgressSeasons({ ...params, show, seasons: [], hide: true })).toBe(false);
  });
});
