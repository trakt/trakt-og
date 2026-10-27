import { render } from 'svelte/server';
import { describe, expect, it } from 'vitest';
import MobileSplashOverPage from './MobileSplashOverPage.spec.svelte';

const appWrapper = (html: string) => html.match(/<div class="app[^"]*"[^>]*>/)?.[0] ?? '';

describe('component: MobileSplash', () => {
  describe('on a phone', () => {
    const { body } = render(MobileSplashOverPage, { props: { phone: true } });

    it('should render the page, ahead of the splash', () => {
      expect(body).toContain('<h1>Inception</h1>');
      expect(body.indexOf('id="content"')).toBeLessThan(body.indexOf('data-mobile-splash'));
    });

    it('should make the page under the splash inert', () => {
      expect(appWrapper(body)).toMatch(/\binert\b/);
    });
  });

  describe('on a desktop', () => {
    const { body } = render(MobileSplashOverPage, { props: { phone: false } });

    it('should render the page', () => {
      expect(body).toContain('<h1>Inception</h1>');
    });

    it('should leave the page reachable', () => {
      expect(appWrapper(body)).not.toMatch(/\binert\b/);
    });
  });
});
