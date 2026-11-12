<script lang="ts">
import SeoHead from '#lib/seo/SeoHead.svelte';
import { staticSeo } from '#lib/seo/pages/staticSeo.ts';
import AuthStepScreen from '#lib/auth/AuthStepScreen.svelte';
import { logout } from '#lib/auth/logout.ts';
</script>

<SeoHead {...staticSeo['/signout']} />

<AuthStepScreen scene="signOut" run={logout} />
