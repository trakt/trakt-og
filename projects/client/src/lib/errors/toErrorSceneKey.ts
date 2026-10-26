import type { ErrorSceneKey } from './ErrorSceneKey.ts';

const BY_STATUS: Readonly<Record<number, ErrorSceneKey>> = {
  400: 'badLink',
  404: 'notFound',
  // The API rate limiting the viewer: its message says how long to wait.
  429: 'upstream',
  502: 'upstream',
  503: 'maintenance',
  504: 'timeout',
};

/** Picks the error page for a status. Any other 4xx reads as not found, and any other 5xx as og breaking. */
export function toErrorSceneKey(status: number): ErrorSceneKey {
  return BY_STATUS[status] ?? (status < 500 ? 'notFound' : 'broken');
}
