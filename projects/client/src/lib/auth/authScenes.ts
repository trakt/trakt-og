import type { AuthFailure } from './authFailure.ts';

/** Each sign-in and sign-out screen, with a line from Han Solo, who makes most of the hyperspace jumps. */
export type AuthScene = 'signIn' | 'return' | 'signOut';

type SceneLine = {
  /** What the step is doing, for screen readers. */
  readonly label: string;
  readonly quote: string;
  readonly credit: string;
};

export const AUTH_SCENES: Readonly<Record<AuthScene, SceneLine>> = {
  signIn: { label: 'Signing in', quote: "Here's where the fun begins.", credit: 'Han Solo' },
  return: { label: 'Signing in', quote: "Chewie, we're home.", credit: 'Han Solo' },
  signOut: { label: 'Signing out', quote: 'May the Force be with you.', credit: 'Han Solo' },
};

const FAILURE_QUOTES: Readonly<Record<AuthFailure, string>> = {
  rateLimited: "It's not my fault.",
  unreachable: 'I have a bad feeling about this.',
};

/** The scene's line, or once its step fails, Han owning up to the trouble instead. */
export const authLine = (scene: AuthScene, failure?: AuthFailure | null): SceneLine =>
  failure ? { ...AUTH_SCENES[scene], quote: FAILURE_QUOTES[failure] } : AUTH_SCENES[scene];
