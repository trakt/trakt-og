<script lang="ts">
import HomePage from '$lib/home/HomePage.svelte';

const { data } = $props();
</script>

<HomePage {data} />
