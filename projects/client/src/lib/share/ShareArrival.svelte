<!--
  Credits a member's shared link: when a signed-in viewer arrives on a page with `?share=<code>`, the visit is recorded
  for the sharer. A signed-out visitor isn't counted, but the code stays in the URL, so signing in from here still
  credits it. Renders nothing; mount it once on each page a member can share.
-->
<script lang="ts">
import { afterNavigate } from '$app/navigation';
import { page } from '$app/state';
import { viewerFetch } from '$lib/auth/viewerFetch';
import { recordShareClick } from './recordShareClick.ts';
import { toShareClick } from './toShareClick.ts';

afterNavigate(({ to }) => {
  const click = to && page.data.user ? toShareClick(to.url) : null;
  if (click) void recordShareClick({ fetch: viewerFetch(), click });
});
</script>
