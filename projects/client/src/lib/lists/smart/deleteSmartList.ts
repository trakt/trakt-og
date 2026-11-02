type Params = {
  request: (path: string, method: string) => Promise<Response>;
  slug: string;
};

/** Deletes one of the viewer's smart lists. True when it's gone, including when it already was. */
export async function deleteSmartList({ request, slug }: Params): Promise<boolean> {
  const response = await request(`/users/me/smart-lists/${encodeURIComponent(slug)}`, 'DELETE').catch(() => null);
  return response?.ok === true || response?.status === 404;
}
