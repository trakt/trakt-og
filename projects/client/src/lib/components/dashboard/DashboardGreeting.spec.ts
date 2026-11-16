import { render } from 'svelte/server';
import { describe, expect, it } from 'vitest';
import { toProfileUser } from '../../users/toProfileUser.ts';
import DashboardGreeting from './DashboardGreeting.svelte';

const cover = 'https://media.trakt.tv/images/shows/000/099/080/fanarts/full/a049f455c1.jpg';
const viewer = (vip: boolean) =>
  toProfileUser({
    username: 'og_tester',
    name: 'OG Tester',
    private: false,
    vip,
    ids: { slug: 'og_tester' },
    vip_cover_image: cover,
  });
const html = (vip: boolean) =>
  render(DashboardGreeting, { props: { user: viewer(vip), memberSince: 'Aug 20, 2020', watching: null } }).body;

describe('DashboardGreeting', () => {
  it("should show a non-VIP's chosen cover, as their profile does", () => {
    expect(html(false)).toContain(`${cover}.webp`);
  });

  it("should show a VIP's chosen cover", () => {
    expect(html(true)).toContain(`${cover}.webp`);
  });
});
