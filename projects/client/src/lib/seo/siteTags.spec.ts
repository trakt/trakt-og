import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { SITE_TAGS } from './siteTags.ts';

const APP_HTML = readFileSync(new URL('../../app.html', import.meta.url), 'utf8');

describe('SITE_TAGS', () => {
  it.each(SITE_TAGS)("should match app.html's %s", (tag) => {
    expect(APP_HTML).toContain(tag);
  });
});
