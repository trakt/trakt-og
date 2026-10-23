<script lang="ts">
import Container from '$lib/components/container/Container.svelte';
import { callbackReturnPath } from '$lib/auth/callbackReturnPath';
import { storeToken } from '$lib/auth/storeToken';
import { userManager } from '$lib/auth/userManager';
import { onMount } from 'svelte';

onMount(async () => {
  const user = await userManager().signinCallback().catch(() => undefined);
  if (user) await storeToken(user).catch(() => {});

  // replace, not goto: the ?code= URL must not stay in history, and a full load renders the signed-in SSR.
  location.replace(callbackReturnPath(user?.state));
});
</script>

<svelte:head>
  <title>Signing in - Trakt</title>
</svelte:head>

<section>
  <Container>
    <p>Signing in…</p>
  </Container>
</section>

<style>
section {
  padding-block: calc(var(--header-height) + var(--gutter)) var(--gutter);
}
</style>
