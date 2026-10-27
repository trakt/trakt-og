import { SHARE_PARAM } from './shareParam.ts';

type ToShareUrlParams = {
  /** An absolute URL. */
  url: string;
  /** The signed-in sharer's code, from their settings. */
  shareCode?: string | null;
};

/** `url` with the sharer's code, so a signed-in friend who opens it credits them. Without a code it's unchanged. */
export function toShareUrl({ url, shareCode }: ToShareUrlParams): string {
  if (!shareCode) return url;
  const shared = URL.parse(url);
  if (!shared) return url;

  shared.searchParams.set(SHARE_PARAM, shareCode);
  return shared.href;
}
