<!-- The splash over a page, the way the root layout wraps every page, for MobileSplash.spec.ts. -->
<script lang="ts">
import MobileSplash from './MobileSplash.svelte';

const { phone }: { phone: boolean } = $props();
</script>

<MobileSplash platform={phone ? 'ios' : 'android'} {phone} covering={phone}>
  <main id="content">
    <h1>Inception</h1>
  </main>
</MobileSplash>
