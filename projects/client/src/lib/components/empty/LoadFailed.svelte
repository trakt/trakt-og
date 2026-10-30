<!--
  The "didn't load" empty state: the dashed EmptyState in warning orange, "{what} didn't load." and a Try again button.
  Try again reruns the page's loaders, so a streamed promise is fetched again; pass `onretry` when the section fetched
  on its own (a picker's reload). Pass the caught `error` so a rate-limited read (`isApiRateLimited`) says the API is
  rate limiting the viewer. Pass `action` when trying again can't help, like a list whose saved filters break its read.
    <LoadFailed what="Up Next" {error} />
-->
<script lang="ts">
import { invalidateAll } from '$app/navigation';
import { isApiRateLimited } from '$lib/api/isApiRateLimited';
import type { EmptyAction } from './EmptyAction.ts';
import EmptyState from './EmptyState.svelte';

interface Props {
  /** The section, as its heading names it. */
  what: string;
  /** Why it failed, as the section caught it. */
  error?: unknown;
  onretry?: () => unknown;
  /** Replaces Try again. */
  action?: EmptyAction;
  inFrame?: boolean;
}

const { what, error, onretry = invalidateAll, action, inFrame = false }: Props = $props();

let busy = $state(false);

const title = $derived(
  isApiRateLimited(error)
    ? `${what} didn't load. Trakt's API is rate limiting your requests.`
    : `${what} didn't load.`,
);

async function retry() {
  busy = true;
  try {
    await onretry();
  } finally {
    busy = false;
  }
}
</script>

<EmptyState failed {inFrame} {title}
  action={action ?? { onclick: retry, text: busy ? 'Trying again…' : 'Try again', busy }} />
