/**
 * The two methods used from Cloudflare's `Cache`. The adapter types it with the Worker's own Response, which
 * TypeScript can't match to the DOM's; at runtime they're one class.
 */
export interface ResponseCache {
  match(key: string): Promise<Response | undefined>;
  put(key: string, response: Response): Promise<void>;
}
