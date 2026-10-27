import type { JsonLd } from './jsonLd/JsonLd.ts';

/**
 * A `<script type="application/ld+json">` tag. `<`, `>` and `&` are escaped as JSON unicode escapes, so text like
 * `</script>` in an overview can't close the tag, and the line separators JavaScript rejects are escaped too.
 */
export function toJsonLdScript(data: JsonLd): string {
  const json = JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
  return `<script type="application/ld+json">${json}</script>`;
}
