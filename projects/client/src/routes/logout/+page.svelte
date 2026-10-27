<script lang="ts">
import SeoHead from '$lib/seo/SeoHead.svelte';
import Container from '$lib/components/container/Container.svelte';
import { logout } from '$lib/auth/logout';
import { onMount } from 'svelte';

// OG's sign-out URL.
onMount(logout);
</script>

<SeoHead title="Sign out" />

<section>
  <Container>
    <p>Signing out…</p>
  </Container>
</section>

<style>
section {
  padding-block: calc(var(--header-height) + var(--gutter)) var(--gutter);
}
</style>
