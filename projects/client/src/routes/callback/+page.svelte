<script lang="ts">
import SeoHead from '#lib/seo/SeoHead.svelte';
import { staticSeo } from '#lib/seo/pages/staticSeo.ts';
import { AnalyticsEvent } from '#lib/analytics/AnalyticsEvent.ts';
import { useTrack } from '#lib/analytics/useTrack.ts';
import AuthStepScreen from '#lib/auth/AuthStepScreen.svelte';
import { isDeclinedSignIn } from '#lib/auth/authFailure.ts';
import { callbackReturnPath } from '#lib/auth/callbackReturnPath.ts';
import { login } from '#lib/auth/login.ts';
import { storeToken } from '#lib/auth/storeToken.ts';
import { toLoginFailureCode } from '#lib/auth/toLoginFailureCode.ts';
import { userManager } from '#lib/auth/userManager.ts';
import type { User } from 'oidc-client-ts';

const { track: trackLoginComplete } = useTrack(AnalyticsEvent.LoginComplete);
const { track: trackLoginFailed } = useTrack(AnalyticsEvent.LoginFailed);

async function storeSession(user: User) {
  const response = await storeToken(user).catch(() => null);
  if (response?.ok) return trackLoginComplete();
  trackLoginFailed({ error: 'session_not_stored' });
}

// A declined sign in goes back signed out. Any other failure retries from the start, since the code is spent and its
// return path went with it.
async function finish() {
  const user = await userManager()
    .signinCallback()
    .catch((error: unknown) => {
      trackLoginFailed({ error: toLoginFailureCode(error) });
      if (isDeclinedSignIn(error)) return undefined;
      throw error;
    });
  if (user) await storeSession(user);

  // replace, not goto: the ?code= URL must not stay in history, and a full load renders the signed-in SSR.
  // Signing in from the header or the home page lands on the dashboard, where a new member's welcome wall is.
  const to = callbackReturnPath(user?.state);
  location.replace(user && (to === '/' || to === '/home') ? '/dashboard' : to);
}
</script>

<SeoHead {...staticSeo['/callback']} />

<AuthStepScreen scene="return" run={finish} retry={() => login('redirect', '/')} />
