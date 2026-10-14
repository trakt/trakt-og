import { klipyUrl } from './klipyUrl.ts';

type ShareGifParams = { slug: string; customerId: string; fetch?: typeof fetch };

/**
 * Tells Klipy a GIF was used, once the comment carrying it posts: Klipy ranks on usage. Fire-and-forget, so it never
 * holds up a post.
 */
export function shareGif({ slug, customerId, fetch = globalThis.fetch }: ShareGifParams): Promise<void> {
  return fetch(klipyUrl(`gifs/share/${encodeURIComponent(slug)}`), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ customer_id: customerId }),
  })
    .then(() => undefined)
    .catch(() => undefined);
}
