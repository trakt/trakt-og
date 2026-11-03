<script lang="ts">
import { browser, dev } from '$app/environment';
import { page } from '$app/state';
import type { HeaderUser } from '$lib/components/header/HeaderUser';
import { onDestroy } from 'svelte';
import { analytics } from './analytics.ts';
import { createHalEngine } from './createHalEngine.ts';
import { getUserAnalyticsData } from './getUserAnalyticsData.ts';
import { isReportingEnabled } from './isReportingEnabled.ts';
import PageView from './PageView.svelte';

const { user }: { user: HeaderUser | null } = $props();

// Installed while this component sets up, before its first page view mounts.
if (browser) {
  const engine = createHalEngine({
    isReporting: isReportingEnabled({ origin: location.origin, dev }),
    enrich: () => getUserAnalyticsData(user),
  });
  // The design demos render real components; clicking around them isn't product use.
  const uninstall = analytics.install({
    record: (key, data) => {
      if (!page.route.id?.startsWith('/_design')) engine.record(key, data);
    },
  });

  onDestroy(() => {
    uninstall();
    engine.destroy();
  });
}
</script>

<!-- Keyed on the pathname, not `route.id`: two pages sharing a template are still distinct page views. -->
{#key page.url.pathname}
  <PageView />
{/key}
