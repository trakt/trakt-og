import { describe, expect, it } from 'vitest';
import { headerArt } from './headerArt.ts';

const fakeStyle = () => {
  const values = new Map<string, string>();
  return {
    getPropertyValue: (name: string) => values.get(name) ?? '',
    setProperty: (name: string, value: string | null) => void values.set(name, value ?? ''),
    removeProperty: (name: string) => {
      const before = values.get(name) ?? '';
      values.delete(name);
      return before;
    },
  };
};

const attach = (url: string | undefined, style: ReturnType<typeof fakeStyle>) =>
  headerArt(url, style)(null as unknown as HTMLElement);

describe('attachment: headerArt', () => {
  it('should hand the backdrop to the header as a CSS image', () => {
    const style = fakeStyle();
    attach('https://media.trakt.tv/a.jpg.webp', style);
    expect(style.getPropertyValue('--header-art')).toBe('url("https://media.trakt.tv/a.jpg.webp")');
  });

  it('should clear the backdrop when the page goes away', () => {
    const style = fakeStyle();
    const cleanup = attach('https://media.trakt.tv/a.jpg.webp', style);
    cleanup?.();
    expect(style.getPropertyValue('--header-art')).toBe('');
  });

  it("should keep the next page's backdrop when the old page cleans up after it", () => {
    const style = fakeStyle();
    const old = attach('https://media.trakt.tv/a.jpg.webp', style);
    attach('https://media.trakt.tv/b.jpg.webp', style);
    old?.();
    expect(style.getPropertyValue('--header-art')).toBe('url("https://media.trakt.tv/b.jpg.webp")');
  });

  it('should leave the header alone without a backdrop', () => {
    const style = fakeStyle();
    expect(attach(undefined, style)).toBeUndefined();
    expect(style.getPropertyValue('--header-art')).toBe('');
  });

  it('should escape quotes so the URL cannot break out of the CSS string', () => {
    const style = fakeStyle();
    attach('https://media.trakt.tv/a".jpg', style);
    expect(style.getPropertyValue('--header-art')).toBe('url("https://media.trakt.tv/a%22.jpg")');
  });
});
