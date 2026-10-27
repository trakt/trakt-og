import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

interface ManifestIcon {
  src: string;
  type: string;
  sizes: string;
  purpose: string;
}

const STATIC = new URL('../static/', import.meta.url);
const APP_HTML = readFileSync(new URL('./app.html', import.meta.url), 'utf8');
const manifest = JSON.parse(readFileSync(new URL('manifest.webmanifest', STATIC), 'utf8'));
const icons: ManifestIcon[] = manifest.icons;

function readStatic(path: string) {
  return readFileSync(new URL(path.replace(/^\//, ''), STATIC));
}

function pngSize(path: string) {
  const png = readStatic(path);
  return `${png.readUInt32BE(16)}x${png.readUInt32BE(20)}`;
}

function metaContent(name: string) {
  return APP_HTML.match(new RegExp(`<meta name="${name}" content="([^"]+)"`))?.[1];
}

describe('static: manifest.webmanifest', () => {
  it('should be linked from every page', () => {
    expect(APP_HTML).toContain('<link rel="manifest" href="%sveltekit.assets%/manifest.webmanifest" />');
  });

  it('should match the page theme color', () => {
    expect(manifest.theme_color).toBe(metaContent('theme-color'));
  });

  it('should declare each PNG icon at its real size', () => {
    for (const icon of icons.filter(({ type }) => type === 'image/png')) {
      expect(pngSize(icon.src), icon.src).toBe(icon.sizes);
    }
  });

  it('should point each SVG icon at an SVG', () => {
    for (const icon of icons.filter(({ type }) => type === 'image/svg+xml')) {
      expect(readStatic(icon.src).toString('utf8'), icon.src).toMatch(/^<svg /);
    }
  });

  it('should offer the PNG sizes installers need', () => {
    const pngs = icons.filter(({ type }) => type === 'image/png').map(({ sizes, purpose }) => `${sizes} ${purpose}`);

    expect(pngs).toEqual(expect.arrayContaining(['192x192 any', '512x512 any', '512x512 maskable']));
  });
});

describe('static: apple-touch-icon.png', () => {
  it('should be the 180px size iOS asks for', () => {
    expect(APP_HTML).toContain('apple-touch-icon.png" sizes="180x180"');
    expect(pngSize('apple-touch-icon.png')).toBe('180x180');
  });
});
