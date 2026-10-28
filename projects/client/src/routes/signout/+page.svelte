<script lang="ts">
import SeoHead from '$lib/seo/SeoHead.svelte';
import AuthStepScreen from '$lib/auth/AuthStepScreen.svelte';
import { logout } from '$lib/auth/logout';
</script>

<SeoHead title="Sign out" />

<AuthStepScreen scene="signOut" run={logout} />
