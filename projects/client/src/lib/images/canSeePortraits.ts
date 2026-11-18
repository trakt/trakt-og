import type { HeaderUser } from '../components/header/HeaderUser.ts';

/** Whether cast cards show actors in character: directors while it's tried out, then likely VIPs. */
export function canSeePortraits(user: Pick<HeaderUser, 'isDirector'> | null): boolean {
  return user?.isDirector === true;
}
