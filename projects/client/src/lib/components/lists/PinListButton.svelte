<!--
  Pin to dashboard, on a list page's title row and a list row: an orange outline tack that fills in, solid, once the
  list is pinned, like Like turning blue. `labelled` adds "Pin" or "Pinned" for the title row's outline buttons. It
  reads and saves the og-dashboard cookie, so it settles once the page is in the browser, and opening a pinned list
  keeps its name and owner fresh on the dashboard. The parent draws the box: ListTitleRow styles it as an `.action`
  with `.pin`, lit with `.active`, and ListRow as its `.pin-slot`'s button.
    <PinListButton viewer={data.user.slug} pin={{ kind: 'smart', id: list.slug, owner, name: list.name }} labelled />
-->
<script lang="ts">
import { resolve } from '$app/paths';
import { toast } from '#lib/components/toast/toast.svelte.ts';
import Tooltip from '#lib/components/tooltip/Tooltip.svelte';
import { dashboardPrefs } from '#lib/dashboard/dashboardPrefs.ts';
import { type ListPin, MAX_LIST_PINS, pinKey } from '#lib/dashboard/listPins.ts';
import Icon from '#lib/icons/Icon.svelte';
import thumbtackOutline from '#lib/icons/regular/thumbtack.svg?raw';
import thumbtack from '#lib/icons/solid/thumbtack.svg?raw';
import { goto } from '$app/navigation';

interface Props {
  /** The signed-in viewer's slug, whose dashboard it pins to. */
  viewer: string;
  pin: Omit<ListPin, 'hidden'>;
  /** "Pin" or "Pinned" after the tack, as an outline button. */
  labelled?: boolean;
}

const { viewer, pin, labelled = false }: Props = $props();

let pinned = $state(false);

const layout = () => dashboardPrefs.layoutOf(dashboardPrefs.load(viewer));
const save = (next: ReturnType<typeof layout>) =>
  dashboardPrefs.save(viewer, dashboardPrefs.withLayout(dashboardPrefs.load(viewer), next));

$effect(() => {
  const current = layout();
  const saved = current.pins.find((entry) => pinKey(entry) === pinKey(pin));
  pinned = Boolean(saved);
  if (saved && (saved.name !== pin.name || saved.by !== pin.by)) {
    const next = dashboardPrefs.pin(current, pin);
    if (next) save(next);
  }
});

const openDashboard = { label: 'View', run: () => void goto(resolve('/dashboard')) };

function toggle() {
  const current = layout();
  if (pinned) {
    save(dashboardPrefs.unpin(current, pinKey(pin)));
    pinned = false;
    toast.success(`${pin.name} is off your dashboard.`);
    return;
  }
  const next = dashboardPrefs.pin(current, pin);
  if (!next) {
    toast.error(`You can pin up to ${MAX_LIST_PINS} lists. Unpin one from your dashboard first.`, openDashboard);
    return;
  }
  save(next);
  pinned = true;
  toast.success(`${pin.name} is pinned to your dashboard.`, openDashboard);
}
</script>

<Tooltip text={pinned ? 'Unpin from dashboard' : 'Pin to dashboard'}>
  {#snippet trigger(tooltip)}
    <button type="button" class={['action', 'pin', { active: pinned }]} aria-label="Pin to dashboard"
      aria-pressed={pinned} {...tooltip} onclick={toggle}><Icon svg={pinned ? thumbtack : thumbtackOutline} />{#if labelled}<span
          class="action-text">{pinned ? 'Pinned' : 'Pin'}</span>{/if}</button>
  {/snippet}
</Tooltip>
