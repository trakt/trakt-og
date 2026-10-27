const NAMESPACE = 'http://www.sitemaps.org/schemas/sitemap/0.9';
const DECLARATION = '<?xml version="1.0" encoding="UTF-8"?>';
const MAX_URLS = 50_000;
const MAX_BYTES = 50 * 1024 * 1024;
const MAX_LOC = 2048;
const W3C_DATETIME = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2}))?$/;
const TAG = /^<(\/?)([A-Za-z][\w:-]*)((?:\s+[\w:-]+="[^"<&]*")*)\s*(\/?)>$/;
const ENTITIES: Readonly<Record<string, string>> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };

type XmlElement = { name: string; attributes: string; children: XmlElement[]; text: string };

// The sitemaps.org XSDs, as rules: each entry's children in order, and which are required.
const ENTRIES = {
  urlset: { entry: 'url', fields: ['loc', 'lastmod', 'changefreq', 'priority'] },
  sitemapindex: { entry: 'sitemap', fields: ['loc', 'lastmod'] },
} as const;

const unescape = (text: string) => text.replace(/&(\w+);/g, (_, name: string) => ENTITIES[name] ?? '');

function textErrors(text: string): string[] {
  const stray = text.replace(/&(amp|lt|gt|quot|apos);/g, '');
  return stray.includes('&') ? [`unescaped "&" in ${JSON.stringify(text)}`] : [];
}

/** A strict, small XML reader for the subset sitemaps use: elements, attributes and escaped text. */
function parse(body: string): { root: XmlElement | null; errors: string[] } {
  const errors: string[] = [];
  const document: XmlElement = { name: '#document', attributes: '', children: [], text: '' };
  const stack: XmlElement[] = [document];

  for (const token of body.match(/<[^>]*>|[^<]+/g) ?? []) {
    const parent = stack.at(-1) ?? document;
    if (!token.startsWith('<')) {
      errors.push(...textErrors(token));
      parent.text += unescape(token);
      continue;
    }

    const tag = TAG.exec(token);
    if (!tag) {
      errors.push(`malformed tag ${token}`);
      continue;
    }
    const [, closing, name = '', attributes = '', selfClosing] = tag;
    if (closing) {
      if (parent.name !== name) errors.push(`</${name}> closes <${parent.name}>`);
      stack.pop();
      continue;
    }

    const element: XmlElement = { name, attributes, children: [], text: '' };
    parent.children.push(element);
    if (!selfClosing) stack.push(element);
  }

  if (stack.length !== 1) errors.push(`unclosed <${stack.at(-1)?.name}>`);
  if (document.text.trim()) errors.push('text outside the root element');
  if (document.children.length !== 1) errors.push(`${document.children.length} root elements`);
  return { root: document.children.at(0) ?? null, errors };
}

function fieldErrors(field: XmlElement): string[] {
  if (field.children.length > 0) return [`<${field.name}> has child elements`];
  if (field.name === 'loc' && !/^https?:\/\/[^\s]+$/.test(field.text)) return [`<loc> ${field.text} is not absolute`];
  if (field.name === 'loc' && field.text.length > MAX_LOC) return [`<loc> is over ${MAX_LOC} characters`];
  if (field.name === 'lastmod' && !W3C_DATETIME.test(field.text)) return [`<lastmod> ${field.text} is not W3C`];
  return [];
}

function entryErrors(entry: XmlElement, expected: string, fields: readonly string[]): string[] {
  if (entry.name !== expected) return [`<${entry.name}> where <${expected}> belongs`];
  if (entry.text.trim()) return [`text inside <${expected}>`];

  const names = entry.children.map(({ name }) => name);
  const order = names.map((name) => fields.indexOf(name));
  const errors = [
    ...(names.filter((name) => name === 'loc').length === 1 ? [] : [`<${expected}> needs exactly one <loc>`]),
    ...(order.some((index) => index < 0) ? [`<${expected}> has unknown children: ${names.join(', ')}`] : []),
    ...(order.some((index, i) => i > 0 && index <= (order.at(i - 1) ?? -1))
      ? [`<${expected}> children out of order or repeated: ${names.join(', ')}`]
      : []),
  ];
  return [...errors, ...entry.children.flatMap(fieldErrors)];
}

/**
 * Why `body` breaks the sitemap protocol (sitemaps.org's `sitemap.xsd` and `siteindex.xsd`), or nothing: well formed
 * and escaped, the right root and namespace, each entry's fields in order, absolute `<loc>`s, W3C `<lastmod>`s, and at
 * most 50,000 entries and 50 MB.
 */
export function sitemapSchemaErrors(body: string): string[] {
  if (!body.startsWith(DECLARATION)) return ['missing the UTF-8 XML declaration'];
  if (new TextEncoder().encode(body).length > MAX_BYTES) return ['over 50 MB'];

  const { root, errors } = parse(body.slice(DECLARATION.length));
  if (errors.length > 0 || !root) return errors;
  if (root.name !== 'urlset' && root.name !== 'sitemapindex') return [`<${root.name}> is not a sitemap root`];
  if (root.attributes.trim() !== `xmlns="${NAMESPACE}"`) return [`<${root.name}> needs xmlns="${NAMESPACE}"`];
  if (root.text.trim()) return [`text inside <${root.name}>`];
  if (root.children.length > MAX_URLS) return [`${root.children.length} entries, over ${MAX_URLS}`];

  const { entry, fields } = ENTRIES[root.name];
  return root.children.flatMap((child) => entryErrors(child, entry, fields));
}
