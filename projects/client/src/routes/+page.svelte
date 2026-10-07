<script lang="ts">
import ComingSoonPage from '$lib/coming-soon/ComingSoonPage.svelte';

const { data } = $props();
</script>

<ComingSoonPage teaser={data.teaser} />
