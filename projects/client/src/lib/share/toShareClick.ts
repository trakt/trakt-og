import type { ShareClick } from './ShareClick.ts';
import { SHARE_PARAM } from './shareParam.ts';

// The API's share codes; anything else can't credit anyone, so it isn't sent.
const SHARE_CODE = /^[0-9A-Za-z]{12}$/;

/** The share click a visit to `url` records, when it came through a member's shared link. */
export function toShareClick(url: URL): ShareClick | null {
  const code = url.searchParams.get(SHARE_PARAM);
  if (!code || !SHARE_CODE.test(code)) return null;

  return { code, url: url.href };
}
