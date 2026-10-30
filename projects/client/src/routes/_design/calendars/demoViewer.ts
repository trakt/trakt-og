import type { HeaderUser } from '../../../lib/components/header/HeaderUser.ts';

/** The signed-in viewer the site-page demos stand in for the layout's, which is signed out there. A member since 2020. */
export const demoViewer: HeaderUser = {
  slug: 'og_tester',
  firstName: 'OG',
  displayName: 'OG Tester',
  avatarUrl: 'https://media.trakt.tv/hotlink-ok/placeholders/medium/leela.png',
  joinedAt: '2020-08-20T19:23:00.000Z',
  named: true,
  isVip: true,
};
