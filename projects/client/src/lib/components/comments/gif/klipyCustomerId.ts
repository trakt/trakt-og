const STORAGE_KEY = 'og:klipy-customer-id';

// Storage can be off, so the id has to survive in memory too.
let cached: string | undefined;

/** An opaque per-browser id, so Klipy can personalise without a Trakt identity. */
export function klipyCustomerId(): string {
  if (cached) return cached;
  try {
    cached = localStorage.getItem(STORAGE_KEY) ?? undefined;
  } catch {
    // Private mode: a new id each page load.
  }
  if (cached) return cached;

  cached = crypto.randomUUID();
  try {
    localStorage.setItem(STORAGE_KEY, cached);
  } catch {
    // Not remembered.
  }
  return cached;
}
