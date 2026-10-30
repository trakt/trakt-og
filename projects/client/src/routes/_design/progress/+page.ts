import type { HeaderUser } from '../../../lib/components/header/HeaderUser.ts';

// A signed-in VIP viewer for the page's controls (rewatch sends everyone else to the VIP page).
const VIEWER: HeaderUser = {
  slug: 'demo',
  firstName: 'Demo',
  displayName: 'Demo',
  avatarUrl: '',
  isVip: true,
  joinedAt: null,
  named: true,
};

export const load = () => ({ user: VIEWER });
