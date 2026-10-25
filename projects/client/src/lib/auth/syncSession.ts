import type { UserManager } from 'oidc-client-ts';
import { renewAccessToken } from './renewAccessToken.ts';
import { storeToken } from './storeToken.ts';

type Listenable = Pick<EventTarget, 'addEventListener' | 'removeEventListener'>;

type SyncSessionParams = {
  manager: UserManager;
  /** Whether the auth cookie reached the server for this page. */
  hasSession: boolean;
  /** Re-runs the loaders once the cookie changed. `invalidateAll` in the app. */
  reload: () => Promise<void>;
  /** Raises `visibilitychange`. `document` in the app. */
  page?: Listenable & Pick<Document, 'visibilityState'>;
  /** Raises `focus`. `window` in the app. */
  view?: Listenable;
};

/**
 * Keeps the httpOnly cookie in step with the browser's user, and reloads page data when it changes.
 * An expired user renews here, because the server never does: on load, and whenever the tab comes back.
 * Returns a cleanup for the event listeners.
 */
export function syncSession({
  manager,
  hasSession,
  reload,
  page = document,
  view = window,
}: SyncSessionParams): () => void {
  const store = (user: Parameters<typeof storeToken>[0]) =>
    storeToken(user)
      .then(reload)
      .catch(() => {});
  const onUnloaded = () => store(null);

  // Switching tabs raises both visibilitychange and focus. One check at a time keeps that to one renewal.
  let checking: Promise<void> | undefined;
  const renewIfExpired = () => {
    checking ??= manager
      .getUser()
      .then(async (user) => {
        if (user?.expired) await renewAccessToken({ manager });
      })
      .catch(() => {})
      .finally(() => {
        checking = undefined;
      });
  };
  const onVisible = () => {
    if (page.visibilityState === 'visible') renewIfExpired();
  };

  manager.events.addUserLoaded(store);
  manager.events.addUserUnloaded(onUnloaded);
  page.addEventListener('visibilitychange', onVisible);
  view.addEventListener('focus', renewIfExpired);

  manager
    .getUser()
    .then(async (user) => {
      // Renewing raises userLoaded, or removes the user on a refused grant, and both land in `store`.
      if (user?.expired) await renewAccessToken({ manager });
      else if ((user !== null) !== hasSession) await store(user);
    })
    .catch(() => {});

  return () => {
    manager.events.removeUserLoaded(store);
    manager.events.removeUserUnloaded(onUnloaded);
    page.removeEventListener('visibilitychange', onVisible);
    view.removeEventListener('focus', renewIfExpired);
  };
}
