<script lang="ts">
import FranchisePage from '#lib/users/progress/franchises/FranchisePage.svelte';
import ProgressPage from '#lib/users/progress/ProgressPage.svelte';
const { data } = $props();
</script>

{#if data.type === 'franchises'}
  <FranchisePage {data} />
{:else}
  <ProgressPage {data} />
{/if}
