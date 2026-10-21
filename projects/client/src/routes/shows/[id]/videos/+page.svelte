<script lang="ts">
import VideosPage from '$lib/videos/VideosPage.svelte';
const { data } = $props();
</script>

<VideosPage {data} />
