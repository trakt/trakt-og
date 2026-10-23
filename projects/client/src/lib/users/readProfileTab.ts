import { profileAccess } from './profileAccess.ts';
import type { ProfileUser } from './ProfileUser.ts';

type Frame = { readonly profile: Pick<ProfileUser, 'isPrivate' | 'isLocked'> };

type Credentials<F> = {
  readonly fetch: typeof globalThis.fetch;
  readonly token: string | null;
  /** Missing on the anonymous read that starts before the frame lands. */
  readonly frame?: F;
};

type Params<F extends Frame, T> = {
  fetch: typeof globalThis.fetch;
  token: string | null;
  /** `parent()`, or its data when the loader already waited on it. */
  frame: F | Promise<F>;
  read: (credentials: Credentials<F>) => Promise<T>;
};

/**
 * A profile tab's one read, with the credentials `profileAccess` gives the frame's profile. `result` is null on a
 * locked profile.
 *
 * Before the frame lands nobody knows which read the tab needs, so the anonymous one starts alongside it: a public
 * profile, the usual case, doesn't wait on the frame. A private profile cancels it, then reads with the token at once.
 * Given the frame's data, it makes the right read only.
 */
export async function readProfileTab<F extends Frame, T>(
  { fetch, token, frame, read }: Params<F, T>,
): Promise<{ frame: F; result: T | null }> {
  const readFor = (known: F) => {
    const access = profileAccess(known.profile);
    if (access === 'none') return null;
    return read({ fetch, token: access === 'viewer' ? token : null, frame: known });
  };
  if (!(frame instanceof Promise)) return { frame, result: await readFor(frame) };

  const controller = new AbortController();
  const early = read({ fetch: (input, init) => fetch(input, { ...init, signal: controller.signal }), token: null });
  // Read or cancelled below; a failure only counts when the anonymous read is the one used.
  early.catch(() => undefined);
  const known = await frame;
  if (profileAccess(known.profile) === 'anonymous') return { frame: known, result: await early };
  controller.abort();
  return { frame: known, result: await readFor(known) };
}
