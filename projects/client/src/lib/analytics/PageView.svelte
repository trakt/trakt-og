<script lang="ts">
import { page } from '$app/state';
import { onMount } from 'svelte';
import { AnalyticsEvent } from './AnalyticsEvent.ts';
import { toPageViewRoute } from './toPageViewRoute.ts';
import { useTrack } from './useTrack.ts';

const { track } = useTrack(AnalyticsEvent.PageView);

onMount(() => {
  const route = toPageViewRoute(page.route.id);
  if (route) track({ route });
});
</script>
