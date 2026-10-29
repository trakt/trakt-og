type Read<T> = (token: string | null) => Promise<T & { status: number }>;

/**
 * The viewer's token, so the owner sees private lists and friends see friends-only ones. A token that stopped working
 * reads the public lists instead: the server never refreshes, the browser does.
 */
export async function withViewer<T>(token: string | null, read: Read<T>) {
  const first = await read(token);
  return first.status === 401 && token ? await read(null) : first;
}
