import type { SeoHtml } from './SeoHtml.ts';

const ENTITIES: Readonly<Record<string, string>> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };

const decode = (text: string) =>
  text.replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (entity, code: string) => {
    if (code.startsWith('#x') || code.startsWith('#X')) return String.fromCodePoint(Number.parseInt(code.slice(2), 16));
    if (code.startsWith('#')) return String.fromCodePoint(Number(code.slice(1)));
    return ENTITIES[code.toLowerCase()] ?? entity;
  });

const attributes = (tag: string): ReadonlyMap<string, string> =>
  new Map(
    [...tag.matchAll(/([^\s=/<>"']+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>"']+))/g)].map(([, name, ...values]) => [
      name.toLowerCase(),
      decode(values.find((value) => value !== undefined) ?? ''),
    ]),
  );

const tags = (html: string, name: string) =>
  [...html.matchAll(new RegExp(`<${name}\\b[^>]*>`, 'gi'))].map(([tag]) => attributes(tag));

const text = (html: string) =>
  decode(html.replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, ' ').replace(/<[^>]*>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim();

const metaKey = (meta: ReadonlyMap<string, string>) => (meta.get('name') ?? meta.get('property') ?? '').toLowerCase();

const groupMeta = (metas: readonly ReadonlyMap<string, string>[]): ReadonlyMap<string, readonly string[]> =>
  new Map(
    [...Map.groupBy(metas.filter(metaKey), metaKey)].map(([key, group]) => [
      key,
      group.map((meta) => meta.get('content') ?? ''),
    ]),
  );

/** Reads a server-rendered page's head, JSON-LD and main content with plain patterns: og's own HTML is well formed. */
export function parseSeoHtml(html: string): SeoHtml {
  const page = html.replace(/<!--[\s\S]*?-->/g, '');
  const head = page.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i)?.at(1) ?? '';
  const main = page.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.at(1);

  return {
    titles: [...head.matchAll(/<title\b[^>]*>([\s\S]*?)<\/title>/gi)].map(([, title]) => decode(title).trim()),
    meta: groupMeta(tags(head, 'meta')),
    canonicals: tags(head, 'link')
      .filter((link) => link.get('rel')?.toLowerCase().split(/\s+/).includes('canonical'))
      .map((link) => link.get('href') ?? ''),
    jsonLd: [...page.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)]
      .filter(([, attrs]) => attributes(attrs).get('type')?.toLowerCase() === 'application/ld+json')
      .map(([, , json]) => json),
    main: main === undefined ? null : text(main),
  };
}
