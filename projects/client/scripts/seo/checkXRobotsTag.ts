import type { Check } from './Check.ts';
import type { HostKind } from './HostKind.ts';

/** Preview hosts send `X-Robots-Tag: noindex` on every response; og.trakt.tv never does. */
export function checkXRobotsTag(headers: Headers, hostKind: HostKind): Check {
  const value = headers.get('x-robots-tag') ?? '';
  const noindex = /\bnoindex\b/i.test(value);

  return hostKind === 'preview'
    ? { group: 'x-robots', label: 'X-Robots-Tag noindex', pass: noindex, detail: `got "${value}"` }
    : { group: 'x-robots', label: 'no X-Robots-Tag noindex', pass: !noindex, detail: `got "${value}"` };
}
