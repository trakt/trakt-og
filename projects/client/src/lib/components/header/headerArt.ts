import type { Attachment } from 'svelte/attachments';

type ArtStyle = Pick<CSSStyleDeclaration, 'getPropertyValue' | 'setProperty' | 'removeProperty'>;

/**
 * Hands a page's backdrop to the site header, which smears it into its glass so the bar takes the art's color. It sets
 * `--header-art` on <html> while the element is mounted. The cleanup only clears its own image, so the next page's
 * art survives the old page's teardown when they overlap during navigation.
 */
export function headerArt(url: string | undefined, target?: ArtStyle): Attachment<HTMLElement> {
  return () => {
    if (!url) return;
    const style = target ?? document.documentElement.style;
    const value = `url("${url.replaceAll('"', '%22')}")`;
    style.setProperty('--header-art', value);
    return () => {
      if (style.getPropertyValue('--header-art') === value) style.removeProperty('--header-art');
    };
  };
}
