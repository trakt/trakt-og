import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { settingsRequest } from '../settings/settingsRequest.ts';
import { changeHideSpecials } from './changeHideSpecials.ts';

const API = 'https://apiz.trakt.tv';
const server = setupServer();
beforeAll(() => server.listen({ onUnhandledFrame: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function setup() {
  const shown: boolean[] = [];
  return {
    shown,
    params: {
      apply: (hide: boolean) => shown.push(hide),
      request: settingsRequest(
        (...args) => globalThis.fetch(...args),
        () => {},
      ),
      notify: { error: vi.fn() },
    },
  };
}

describe('changeHideSpecials', () => {
  it.each([true, false])('should save hide_specials as %s', async (hide) => {
    const { shown, params } = setup();
    server.use(
      http.put(`${API}/users/settings`, async ({ request }) => {
        expect(await request.json()).toEqual({ browsing: { calendar: { hide_specials: hide } } });
        // The new state shows before the API answers.
        expect(shown).toEqual([hide]);
        return HttpResponse.json({});
      }),
    );

    expect(await changeHideSpecials({ ...params, hide })).toBe(true);
    expect(shown).toEqual([hide]);
    expect(params.notify.error).not.toHaveBeenCalled();
  });

  it('should go back to the old state with the error when the save fails', async () => {
    const { shown, params } = setup();
    server.use(http.put(`${API}/users/settings`, () => new HttpResponse(null, { status: 500 })));

    expect(await changeHideSpecials({ ...params, hide: true })).toBe(false);
    expect(shown).toEqual([true, false]);
    expect(params.notify.error).toHaveBeenCalledWith("Trakt couldn't save your settings. Please try again.");
  });
});
