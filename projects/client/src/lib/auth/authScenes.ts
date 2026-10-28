/** Each sign-in and sign-out screen, with a line from Han Solo, who makes most of the hyperspace jumps. */
export type AuthScene = 'signIn' | 'return' | 'signOut';

type SceneLine = {
  /** What the step is doing, for screen readers. */
  readonly label: string;
  readonly quote: string;
  readonly credit: string;
};

export const AUTH_SCENES: Readonly<Record<AuthScene, SceneLine>> = {
  signIn: { label: 'Signing in', quote: "Here's where the fun begins.", credit: 'Han Solo, Star Wars' },
  return: { label: 'Signing in', quote: "Chewie, we're home.", credit: 'Han Solo, Star Wars: The Force Awakens' },
  signOut: { label: 'Signing out', quote: 'May the Force be with you.', credit: 'Han Solo, Star Wars' },
};
