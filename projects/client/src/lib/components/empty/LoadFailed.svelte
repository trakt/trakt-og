<!--
  The "didn't load" empty state: the dashed EmptyState in warning orange, "{what} didn't load." and a Try again button.
  Try again reruns the page's loaders, so a streamed promise is fetched again; pass `onretry` when the section fetched
  on its own (a picker's reload).
    <LoadFailed what="Up Next" />
-->
<script lang="ts">
import { invalidateAll } from '$app/navigation';
import EmptyState from './EmptyState.svelte';

interface Props {
  /** The section, as its heading names it. */
  what: string;
  onretry?: () => unknown;
  inFrame?: boolean;
}

const { what, onretry = invalidateAll, inFrame = false }: Props = $props();

let busy = $state(false);

async function retry() {
  busy = true;
  try {
    await onretry();
  } finally {
    busy = false;
  }
}
</script>

<EmptyState failed {inFrame} title="{what} didn't load."
  action={{ onclick: retry, text: busy ? 'Trying again…' : 'Try again', busy }} />
