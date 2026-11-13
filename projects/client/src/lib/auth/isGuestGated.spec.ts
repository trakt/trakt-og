import type { BeforeNavigate } from '$app/navigation';
import { describe, expect, it } from 'vitest';
import { isGuestGated } from './isGuestGated.ts';

type Navigation = Pick<BeforeNavigate, 'type' | 'from' | 'to'>;

const target = (href: string, routeId: string | null) => ({
  url: new URL(href, 'https://og.trakt.tv'),
  route: { id: routeId },
  params: {},
});

const FROM = target('/movies/tron-1982', '/movies/[slug]');

const click = (href: string, routeId: string | null, type: Navigation['type'] = 'link') =>
  ({ type, from: FROM, to: target(href, routeId) }) as Navigation;

describe('isGuestGated', () => {
  it("should send a guest's click to another page to sign in", () => {
    expect(isGuestGated({ hasSession: false, navigation: click('/shows/severance', '/shows/[slug]') })).toBe(true);
    expect(
      isGuestGated({ hasSession: false, navigation: click('/movies/tron-1982/people', '/movies/[slug]/people') }),
    ).toBe(true);
  });

  it('should send a guest to sign in from a link to the same page with another query', () => {
    expect(isGuestGated({ hasSession: false, navigation: click('/movies/tron-1982?page=2', '/movies/[slug]') })).toBe(
      true,
    );
  });

  it('should let a signed-in viewer go anywhere', () => {
    expect(isGuestGated({ hasSession: true, navigation: click('/shows/severance', '/shows/[slug]') })).toBe(false);
  });

  it('should let a guest reach the home, about, help and sign-in pages', () => {
    const open = (href: string, routeId: string) =>
      isGuestGated({ hasSession: false, navigation: click(href, routeId) });

    expect(open('/', '/')).toBe(false);
    expect(open('/about', '/about')).toBe(false);
    expect(open('/help', '/help')).toBe(false);
    expect(open('/signin', '/signin')).toBe(false);
    expect(open('/signout', '/signout')).toBe(false);
  });

  it('should let a guest follow links that leave og or its pages', () => {
    expect(isGuestGated({ hasSession: false, navigation: click('https://trakt.tv/terms', null) })).toBe(false);
    expect(isGuestGated({ hasSession: false, navigation: click('/login', null) })).toBe(false);
  });

  it('should let a guest jump to an anchor on the same page', () => {
    expect(isGuestGated({ hasSession: false, navigation: click('/movies/tron-1982#comments', '/movies/[slug]') })).toBe(
      false,
    );
  });

  it("should leave back, forward and the app's own navigation alone", () => {
    const go = (type: Navigation['type']) =>
      isGuestGated({ hasSession: false, navigation: click('/shows/severance', '/shows/[slug]', type) });

    expect(go('popstate')).toBe(false);
    expect(go('goto')).toBe(false);
    expect(go('form')).toBe(false);
  });
});
