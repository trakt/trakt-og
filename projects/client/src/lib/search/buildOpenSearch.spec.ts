import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { buildOpenSearch } from './buildOpenSearch.ts';

const APP_HTML = readFileSync(new URL('../../app.html', import.meta.url), 'utf8');
const ICON = readFileSync(new URL('../../../static/opensearch-icon.png', import.meta.url));

describe('util: buildOpenSearch', () => {
  const xml = buildOpenSearch('https://og.trakt.tv');

  it('should be advertised on every page for browsers to discover', () => {
    expect(APP_HTML).toContain(
      '<link rel="search" type="application/opensearchdescription+xml" title="Trakt OG Redux" href="/opensearch.xml" />',
    );
  });

  it('should send searches to the search page', () => {
    expect(xml).toContain(
      '<Url type="text/html" method="get" template="https://og.trakt.tv/search?query={searchTerms}"/>',
    );
  });

  it('should point the icon and self link at the serving host', () => {
    const preview = buildOpenSearch('http://localhost:5173');

    expect(preview).toContain(
      '<Image width="16" height="16" type="image/png">http://localhost:5173/opensearch-icon.png</Image>',
    );
    expect(preview).toContain('rel="self" template="http://localhost:5173/opensearch.xml"');
  });

  it('should keep the short name within the 16 characters browsers allow', () => {
    const shortName = xml.match(/<ShortName>(.*)<\/ShortName>/)?.[1] ?? '';

    expect(shortName.length).toBeGreaterThan(0);
    expect(shortName.length).toBeLessThanOrEqual(16);
  });

  it('should ship a 16px icon under the 10 KB Firefox accepts', () => {
    expect(`${ICON.readUInt32BE(16)}x${ICON.readUInt32BE(20)}`).toBe('16x16');
    expect(ICON.length).toBeLessThan(10 * 1024);
  });
});
