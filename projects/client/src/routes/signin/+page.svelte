<script lang="ts">
import SeoHead from '#lib/seo/SeoHead.svelte';
import AuthStepScreen from '#lib/auth/AuthStepScreen.svelte';
import { page } from '$app/state';
import { login } from '#lib/auth/login.ts';
import { returnPath } from '#lib/auth/returnPath.ts';

// The sign-in page. Links pass `?redirect_to=/some/path` to come back to that page.
const start = () => login('redirect', returnPath(page.url.searchParams.get('redirect_to')));
</script>

<SeoHead title="Sign in" />

<AuthStepScreen scene="signIn" run={start} />
