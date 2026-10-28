<script lang="ts">
import SeoHead from '$lib/seo/SeoHead.svelte';
import AuthStepScreen from '$lib/auth/AuthStepScreen.svelte';
import { isDeclinedSignIn } from '$lib/auth/authFailure';
import { callbackReturnPath } from '$lib/auth/callbackReturnPath';
import { login } from '$lib/auth/login';
import { storeToken } from '$lib/auth/storeToken';
import { userManager } from '$lib/auth/userManager';

// A declined sign in goes back signed out. Any other failure retries from the start, since the code is spent and its
// return path went with it.
async function finish() {
  const user = await userManager()
    .signinCallback()
    .catch((error: unknown) => {
      if (isDeclinedSignIn(error)) return undefined;
      throw error;
    });
  if (user) await storeToken(user).catch(() => {});

  // replace, not goto: the ?code= URL must not stay in history, and a full load renders the signed-in SSR.
  // Signing in from the header or the home page lands on the dashboard, where a new member's welcome wall is.
  const to = callbackReturnPath(user?.state);
  location.replace(user && (to === '/' || to === '/home') ? '/dashboard' : to);
}
</script>

<SeoHead title="Signing in" />

<AuthStepScreen scene="return" run={finish} retry={() => login('/')} />
