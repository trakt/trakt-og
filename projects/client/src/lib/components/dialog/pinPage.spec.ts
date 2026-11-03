import { describe, expect, it } from 'vitest';
import { pinPage } from './pinPage.ts';

const fakePage = (scrollY: number) => {
  const styles = new Map<string, string>();
  const page = {
    scrollY,
    scrolled: [] as number[],
    styles,
    body: {
      style: {
        setProperty: (name: string, value: string | null) => void styles.set(name, value ?? ''),
        removeProperty: (name: string) => {
          styles.delete(name);
          return '';
        },
      },
    },
    scrollTo: ({ top }: ScrollToOptions) => {
      page.scrolled.push(top ?? 0);
      page.scrollY = top ?? 0;
    },
  };
  return page;
};

describe('pinPage', () => {
  it('should pin the body where the page was scrolled and put the scroll back on unpin', () => {
    const page = fakePage(1653);
    const unpin = pinPage(page);
    expect(Object.fromEntries(page.styles)).toEqual({ position: 'fixed', 'inset-inline': '0', top: '-1653px' });

    unpin();
    expect(page.styles.size).toBe(0);
    expect(page.scrolled).toEqual([1653]);
  });

  it('should hold the pin until the last nested dialog closes', () => {
    const page = fakePage(400);
    const outer = pinPage(page);
    const inner = pinPage(page);

    inner();
    expect(page.styles.get('position')).toBe('fixed');
    expect(page.scrolled).toEqual([]);

    outer();
    expect(page.styles.size).toBe(0);
    expect(page.scrolled).toEqual([400]);
  });

  it('should count each unpin once', () => {
    const page = fakePage(10);
    const outer = pinPage(page);
    const inner = pinPage(page);

    inner();
    inner();
    expect(page.styles.get('position')).toBe('fixed');

    outer();
    expect(page.styles.size).toBe(0);
  });
});
