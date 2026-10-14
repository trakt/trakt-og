/** A Klipy API path through og's proxy, which adds the API key. */
export function klipyUrl(path: string, params?: URLSearchParams): string {
  const query = params?.toString();
  return `/api/klipy/${path}${query ? `?${query}` : ''}`;
}
