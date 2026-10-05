import type { MobilePlatform } from './MobilePlatform.ts';

/** Reads the platform from the request's user agent. iPadOS reports itself as a Mac, so only Android is matched. */
export function toMobilePlatform(userAgent: string | null): MobilePlatform {
  return /android/i.test(userAgent ?? '') ? 'android' : 'ios';
}
