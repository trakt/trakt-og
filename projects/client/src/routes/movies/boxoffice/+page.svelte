<script lang="ts">
import BoxOfficePage from '$lib/boxoffice/BoxOfficePage.svelte';

const { data } = $props();
</script>

<BoxOfficePage {data} />
