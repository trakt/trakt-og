/** v3's post-credits tag: how many extra scenes there are, and when they play. */
export interface PostCredits {
  readonly count: number;
  readonly hint: string;
}

/** One scene for each of the API's `during_credits` and `after_credits`; nothing when neither is set. */
export function postCredits({ during, after }: { during?: boolean | null; after?: boolean | null }):
  | PostCredits
  | undefined {
  if (during && after) return { count: 2, hint: 'Scenes during and after the credits' };
  if (during) return { count: 1, hint: 'A scene during the credits' };
  if (after) return { count: 1, hint: 'A scene after the credits' };
  return undefined;
}
