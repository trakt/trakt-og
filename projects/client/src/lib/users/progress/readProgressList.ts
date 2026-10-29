/** The list `?list=` narrows progress to, with the API base its items read from. */
export type ProgressList =
  | { readonly kind: 'personal'; readonly id: number; readonly base: string }
  | { readonly kind: 'watchlist' | 'favorites'; readonly owner: string; readonly base: string };

/**
 * `?list=`: a list id (`/lists/:id/items`), or `<user>/watchlist` and `<user>/favorites`, which that read refuses
 * (`/users/:user/watchlist`).
 */
export function readProgressList(value: string | null): ProgressList | undefined {
  const builtIn = value?.match(/^([\w-]+)\/(watchlist|favorites)$/);
  if (builtIn?.[1] && (builtIn[2] === 'watchlist' || builtIn[2] === 'favorites')) {
    const [, owner, kind] = builtIn;
    return { kind, owner, base: `/users/${owner}/${kind}` };
  }
  const id = Number.parseInt(value ?? '', 10);
  return id > 0 ? { kind: 'personal', id, base: `/lists/${id}/items` } : undefined;
}
