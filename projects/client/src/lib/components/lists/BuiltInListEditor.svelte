<!--
  Edits the signed-in owner's watchlist or favorites from anywhere: the Trakt loader while their default sort loads,
  then the dialog, then the save. Mount it to start; it calls `onclose` when the dialog shuts or the read fails, and
  `onsaved` with what was saved.
    {#if editing}<BuiltInListEditor kind="favorites" vip onclose={() => (editing = false)} />{/if}
-->
<script lang="ts">
import { rawApiFetch } from '$lib/api/rawApiFetch';
import { authenticatedFetch } from '$lib/auth/authenticatedFetch';
import { userManager } from '$lib/auth/userManager';
import BuiltInListDialog from '$lib/components/lists/BuiltInListDialog.svelte';
import LoadingOverlay from '$lib/components/loading/LoadingOverlay.svelte';
import { toast } from '$lib/components/toast/toast.svelte';
import { loadBuiltInDefaults } from '$lib/lists/loadBuiltInDefaults';
import type { BuiltInListKind } from '$lib/lists/toBuiltInListView';
import { writeOwnerList } from '$lib/lists/writeOwnerList';

type Saved = { description?: string; sort_by: string; sort_how: string };

interface Props {
  kind: BuiltInListKind;
  vip: boolean;
  /** The description, when the page knows it; left out, the dialog keeps the saved one unless it's edited. */
  description?: string;
  posters?: readonly string[];
  count?: number;
  /** Shown read only in the dialog; see BuiltInListDialog. */
  privacy?: string;
  allowComments?: boolean;
  displayNumbers?: boolean;
  onclose: () => void;
  onsaved?: (saved: Saved) => void;
}

const { kind, vip, description, posters, count, privacy, allowComments, displayNumbers, onclose, onsaved }: Props =
  $props();
const request = (path: string, init?: Parameters<typeof rawApiFetch>[0]['init']) =>
  rawApiFetch({ fetch: authenticatedFetch({ manager: userManager() }), path, init });

let defaults = $state<{ by: string; how: string }>();
let open = $state(false);
let busy = $state(false);

$effect(() => {
  let active = true;
  loadBuiltInDefaults({ kind, request }).then((loaded) => {
    if (!active) return;
    defaults = loaded;
    open = true;
  }).catch(() => {
    if (!active) return;
    toast.error("Doh! We couldn't load your list's default sorting.");
    onclose();
  });
  return () => {
    active = false;
  };
});

async function save(body: Saved) {
  if (busy) return;
  busy = true;
  const ok = await writeOwnerList({ kind, change: { type: 'metadata', body }, request, notify: toast });
  busy = false;
  if (!ok) return;
  toast.success('List saved!');
  onsaved?.(body);
  open = false;
}
</script>

{#if defaults}
  <BuiltInListDialog bind:open {kind} {vip} {busy} {description} {posters} {count} {privacy} {allowComments}
    {displayNumbers} sortBy={defaults.by}
    sortHow={defaults.how} onsave={save} onclose={onclose} />
{:else}
  <LoadingOverlay visible />
{/if}
