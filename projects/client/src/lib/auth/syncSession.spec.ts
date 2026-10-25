import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { fakeUser } from './fakeUser.ts';
import { fakeUserManager } from './fakeUserManager.ts';
import { syncSession } from './syncSession.ts';

const posted: unknown[] = [];
const server = setupServer(
  http.post('http://localhost/api/store-token', async ({ request }) => {
    posted.push(await request.json());
    return new HttpResponse(null, { status: 204 });
  }),
);

function fakeTab() {
  const target = new EventTarget();
  const page = {
    visibilityState: 'visible' as DocumentVisibilityState,
    addEventListener: target.addEventListener.bind(target),
    removeEventListener: target.removeEventListener.bind(target),
  };
  const view = new EventTarget();

  return {
    page,
    view,
    show(state: DocumentVisibilityState) {
      page.visibilityState = state;
      target.dispatchEvent(new Event('visibilitychange'));
    },
    focus() {
      view.dispatchEvent(new Event('focus'));
    },
  };
}

const stops: (() => void)[] = [];

function start(params: Omit<Parameters<typeof syncSession>[0], 'page' | 'view'>) {
  const tab = fakeTab();
  stops.push(syncSession({ ...params, page: tab.page, view: tab.view }));
  return tab;
}

const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

beforeAll(() => {
  vi.stubGlobal('location', new URL('http://localhost/'));
  server.listen({ onUnhandledRequest: 'error' });
});
afterEach(() => {
  stops.splice(0).forEach((stop) => stop());
  server.resetHandlers();
  posted.length = 0;
});
afterAll(() => {
  server.close();
  vi.unstubAllGlobals();
});

describe('syncSession', () => {
  it('should store the token and reload when the server had no cookie', async () => {
    const user = fakeUser('abc', 3600);
    const { manager } = fakeUserManager({ current: user });
    const reload = vi.fn(() => Promise.resolve());

    start({ manager, hasSession: false, reload });

    await vi.waitFor(() => expect(reload).toHaveBeenCalledTimes(1));
    expect(posted).toEqual([{ token: 'abc', expiresAt: (user.expires_at ?? 0) * 1000 }]);
  });

  it('should clear the cookie when the browser has no user', async () => {
    const { manager } = fakeUserManager({});
    const reload = vi.fn(() => Promise.resolve());

    start({ manager, hasSession: true, reload });

    await vi.waitFor(() => expect(reload).toHaveBeenCalledTimes(1));
    expect(posted).toEqual([{ token: null, expiresAt: null }]);
  });

  it('should leave a cookie that matches the browser alone', async () => {
    const fake = fakeUserManager({ current: fakeUser('abc', 3600) });
    const reload = vi.fn(() => Promise.resolve());

    start({ manager: fake.manager, hasSession: true, reload });

    await vi.waitFor(() => expect(fake.getUser).toHaveBeenCalled());
    expect(posted).toEqual([]);
    expect(reload).not.toHaveBeenCalled();
  });

  it('should store a live user when the server saw an expired token', async () => {
    const user = fakeUser('fresh', 3600);
    const { manager } = fakeUserManager({ current: user });
    const reload = vi.fn(() => Promise.resolve());

    start({ manager, hasSession: true, tokenExpired: true, reload });

    await vi.waitFor(() => expect(reload).toHaveBeenCalledTimes(1));
    expect(posted).toEqual([{ token: 'fresh', expiresAt: (user.expires_at ?? 0) * 1000 }]);
  });

  it('should clear an expired token the browser no longer has a user for', async () => {
    const { manager } = fakeUserManager({});
    const reload = vi.fn(() => Promise.resolve());

    start({ manager, hasSession: true, tokenExpired: true, reload });

    await vi.waitFor(() => expect(reload).toHaveBeenCalledTimes(1));
    expect(posted).toEqual([{ token: null, expiresAt: null }]);
  });

  it('should renew an expired user', async () => {
    const fake = fakeUserManager({ current: fakeUser('old', -1) });

    start({ manager: fake.manager, hasSession: true, reload: () => Promise.resolve() });

    await vi.waitFor(() => expect(fake.signinSilent).toHaveBeenCalledTimes(1));
  });

  describe('when the tab comes back', () => {
    async function startValid() {
      const fake = fakeUserManager({ current: fakeUser('abc', 3600) });
      const tab = start({ manager: fake.manager, hasSession: true, reload: () => Promise.resolve() });
      await settle();
      return { fake, tab };
    }

    it('should renew an expired user on focus', async () => {
      const { fake, tab } = await startValid();
      fake.getUser.mockResolvedValue(fakeUser('abc', -1));

      tab.focus();

      await vi.waitFor(() => expect(fake.signinSilent).toHaveBeenCalledTimes(1));
    });

    it('should renew an expired user when the tab becomes visible', async () => {
      const { fake, tab } = await startValid();
      fake.getUser.mockResolvedValue(fakeUser('abc', -1));

      tab.show('visible');

      await vi.waitFor(() => expect(fake.signinSilent).toHaveBeenCalledTimes(1));
    });

    it('should not renew a valid user on focus or visibility', async () => {
      const { fake, tab } = await startValid();

      tab.focus();
      await settle();
      tab.show('visible');
      await settle();

      expect(fake.getUser).toHaveBeenCalledTimes(3);
      expect(fake.signinSilent).not.toHaveBeenCalled();
    });

    it('should not check when the tab is hidden', async () => {
      const { fake, tab } = await startValid();
      fake.getUser.mockResolvedValue(fakeUser('abc', -1));

      tab.show('hidden');
      await settle();

      expect(fake.signinSilent).not.toHaveBeenCalled();
    });

    it('should renew once when visibility and focus arrive together', async () => {
      const { fake, tab } = await startValid();
      fake.getUser.mockResolvedValue(fakeUser('abc', -1));

      tab.show('visible');
      tab.focus();
      await settle();

      expect(fake.signinSilent).toHaveBeenCalledTimes(1);
    });

    it('should stop listening after cleanup', async () => {
      const { fake, tab } = await startValid();
      fake.getUser.mockResolvedValue(fakeUser('abc', -1));

      stops.splice(0).forEach((stop) => stop());
      tab.focus();
      tab.show('visible');
      await settle();

      expect(fake.signinSilent).not.toHaveBeenCalled();
    });
  });
});
