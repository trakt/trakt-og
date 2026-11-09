/** An episode screenshot, on either the ID-based path (`…/screenshot.webp`) or the old one (`…/screenshots/…`). */
export function isScreenshotUrl(url: string | undefined): boolean {
  return /\/screenshots?[/.]/.test(url ?? '');
}
