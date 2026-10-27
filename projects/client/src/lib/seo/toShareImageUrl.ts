/** media.trakt.tv art as a `.jpg` or `.png`: Facebook and LinkedIn reject the `.webp` copies og shows on its pages. */
export function toShareImageUrl(url: string): string {
  return url.replace(/\.(jpe?g|png)\.webp$/i, '.$1');
}
