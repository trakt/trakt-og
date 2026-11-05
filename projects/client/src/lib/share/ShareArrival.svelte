<script lang="ts">
  import { afterNavigate } from '$app/navigation';
  import { page } from '$app/state';
  import { AnalyticsEvent } from '#lib/analytics/AnalyticsEvent.ts';
  import { useTrack } from '#lib/analytics/useTrack.ts';
  import { viewerFetch } from '#lib/auth/viewerFetch.ts';
  import { recordShareArrival } from './recordShareClick.ts';
  import { SHARE_PARAM } from './shareParam.ts';
  import { toShareArrivalType } from './toShareArrivalType.ts';

  const { track } = useTrack(AnalyticsEvent.ShareArrival);

  afterNavigate(async ({ from, to, shallow, type }) => {
    if (shallow && type === 'goto') return;
    if (!to?.url.searchParams.has(SHARE_PARAM) || from?.url.pathname === to.url.pathname) return;
    const outcome = await recordShareArrival({ fetch: page.data.user ? viewerFetch() : null, url: to.url });
    track({ type: toShareArrivalType(to.route.id), outcome });
  });
</script>

<!--
  Credits a member's shared link: when a signed-in viewer arrives on a page with `?share=<code>`, the visit is recorded
  for the sharer. A signed-out visitor isn't counted, but the code stays in the URL, so signing in from here still
  credits it. Every arrival is tracked as web's `share.arrival`, once per page. Renders nothing; mount it once on each
  page a member can share.
-->
