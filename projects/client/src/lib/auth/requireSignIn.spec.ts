import { beforeEach, describe, expect, it, vi } from 'vitest';
import { login } from './login.ts';
import { requireSignIn } from './requireSignIn.ts';
import { userManager } from './userManager.ts';

vi.mock('./login.ts', () => ({ login: vi.fn(() => Promise.resolve()) }));
vi.mock('./userManager.ts', () => ({ userManager: vi.fn() }));

const signedIn = (user: { access_token: string } | null) =>
  vi.mocked(userManager).mockReturnValue({ getUser: () => Promise.resolve(user) } as never);

describe('auth: requireSignIn', () => {
  beforeEach(() => vi.mocked(login).mockClear());

  it('should let a signed-in viewer through without signing in', async () => {
    signedIn({ access_token: 'fake-token' });
    expect(await requireSignIn()).toBe(true);
    expect(login).not.toHaveBeenCalled();
  });

  it('should start sign-in and stop the action when signed out', async () => {
    signedIn(null);
    expect(await requireSignIn()).toBe(false);
    expect(login).toHaveBeenCalledWith('gate');
  });
});
