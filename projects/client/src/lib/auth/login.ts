import { AnalyticsEvent } from '../analytics/AnalyticsEvent.ts';
import type { AnalyticsEventDataMap } from '../analytics/AnalyticsEventDataMap.ts';
import { useTrack } from '../analytics/useTrack.ts';
import { toLoginFailureCode } from './toLoginFailureCode.ts';
import { userManager } from './userManager.ts';

export type LoginSource = AnalyticsEventDataMap[typeof AnalyticsEvent.LoginStart]['source'];

const { track: trackLoginStart } = useTrack(AnalyticsEvent.LoginStart);
const { track: trackLoginFailed } = useTrack(AnalyticsEvent.LoginFailed);

/** Sends the browser to auth.trakt.tv. `/callback` lands it back on `returnTo`. */
export async function login(
  source: LoginSource,
  returnTo: string = location.pathname + location.search,
): Promise<void> {
  trackLoginStart({ source });
  try {
    await userManager().signinRedirect({ state: { returnTo } });
  } catch (error) {
    trackLoginFailed({ error: toLoginFailureCode(error) });
    throw error;
  }
}
