<!--
  The dashboard's follow requests. Up to three show as boxes; from four up they fold into a summary line with an avatar
  stack, and Review opens the boxes. The layout is picked from the count on load, so it doesn't switch while deciding.
-->
<script lang="ts">
import { tick } from 'svelte';
import { page } from '$app/state';
import { rawApiFetch } from '$lib/api/rawApiFetch';
import { createRequestQueue } from '$lib/api/createRequestQueue';
import { authenticatedFetch } from '$lib/auth/authenticatedFetch';
import { userManager } from '$lib/auth/userManager';
import { login } from '$lib/auth/login';
import { changeRelationship } from '$lib/users/changeRelationship';
import { createRelationshipOverlay } from '$lib/users/createRelationshipOverlay.svelte';
import { toast } from '$lib/components/toast/toast.svelte';
import Tooltip from '$lib/components/tooltip/Tooltip.svelte';
import Container from '$lib/components/container/Container.svelte';
import Icon from '$lib/icons/Icon.svelte';
import check from '$lib/icons/trakt/check.svg?raw';
import deleteIcon from '$lib/icons/trakt/delete.svg?raw';
import block from '$lib/icons/trakt/block.svg?raw';
import blockThick from '$lib/icons/trakt/block-thick.svg?raw';
import { followRequestSummary } from '$lib/dashboard/followRequestSummary';
import type { toFollowRequest } from '$lib/dashboard/toFollowRequest';

type Request = ReturnType<typeof toFollowRequest>;

const { requests }: { requests: readonly Request[] } = $props();
const uid = $props.id();
const relationships = createRelationshipOverlay();
const stackSize = 5;
// The API takes one write a second, so approvals go out one at a time at that pace, and a 429 waits its Retry-After.
const writes = createRequestQueue({ concurrency: 1, limit: 1, windowMs: 1000 });
let section = $state<HTMLElement>();
let reviewing = $state(false);
let approving = $state<{ done: number; total: number } | null>(null);
const relation = (id: number) => ({ follow: 'none' as const, followsYou: false, blocked: false, requestId: id });
const decisionOf = (request: Request) => relationships.state(request.slug, relation(request.id)).decision;
const visible = $derived(requests.filter((request) => !['approve', 'deny'].includes(decisionOf(request) ?? '')));
const pending = $derived(visible.filter((request) => decisionOf(request) === null));
const condensed = $derived(requests.length > 3);
const showBoxes = $derived(!condensed || reviewing || pending.length === 0);
const stack = $derived(pending.slice(0, stackSize));
const summary = $derived(followRequestSummary(pending.map((request) => request.name)));
$effect(() => {
  void requests;
  void page.data.user?.slug;
  relationships.clear();
  reviewing = false;
});
const send = (request: Request, action: 'approve' | 'deny' | 'blockRequest') =>
  changeRelationship({
    slug: request.slug,
    isPrivate: false,
    relation: relation(request.id),
    action,
    overlay: relationships,
    request: (path, method) =>
      writes.run(() => rawApiFetch({ path, fetch: authenticatedFetch({ manager: userManager() }), init: { method } })),
    notify: toast,
  });
const progressFallback = () => section?.closest('main')?.querySelector<HTMLAnchorElement>('a[href*="/progress/"]');
async function approveAll() {
  if (approving) return;
  if (!(await userManager().getUser())?.access_token) return login();
  const queue = pending;
  approving = { done: 0, total: queue.length };
  for (const request of queue) {
    // Decided by hand while the others were saving.
    if (decisionOf(request) !== null) {
      approving = { done: approving.done + 1, total: approving.total };
      continue;
    }
    if (!(await send(request, 'approve'))) break;
    approving = { done: approving.done + 1, total: approving.total };
  }
  approving = null;
  await tick();
  if (visible.length === 0) progressFallback()?.focus({ preventScroll: true });
}
async function decide(request: Request, action: 'approve' | 'deny' | 'blockRequest') {
  if (!(await userManager().getUser())?.access_token) return login();
  const next = section?.querySelector<HTMLButtonElement>(`li[data-request="${request.id}"] + li button`);
  const fallback = progressFallback();
  const saving = send(request, action);
  if (action === 'blockRequest') {
    await saving;
    return;
  }
  await tick();
  (next?.isConnected ? next : visible.length > 0 ? section : fallback)?.focus({ preventScroll: true });
  await saving;
}
</script>

<!-- eslint-disable svelte/no-navigation-without-resolve -->
{#if visible.length > 0}
  <section bind:this={section} tabindex="-1" class="inbox" aria-labelledby="{uid}-heading">
  <Container>
      <h2 id="{uid}-heading">
        Follow Requests
        {#if pending.length > 0}<span class="count">{pending.length}<span class="hidden"> pending</span></span>{/if}
      </h2>
      <span class="hidden" role="status">{approving ? `Approving ${approving.total} requests` : ''}</span>
      {#if condensed && pending.length > 0}
        <div class="summary">
          <div class="stack" aria-hidden="true">
            {#each stack as request (request.id)}
              <img src={request.avatarUrl} alt="" width="44" height="44" />
            {/each}
            {#if pending.length > stack.length}<span class="extra">+{pending.length - stack.length}</span>{/if}
          </div>
          <div class="summary-text">
            <p>{#each summary as part, i (i)}{#if part.strong}<strong>{part.text}</strong>{:else}{part.text}{/if}{/each}</p>
            <span class="meta">Newest {pending.at(0)?.requestedAgo} · oldest {pending.at(-1)?.requestedAgo}</span>
          </div>
          <div class="buttons">
            {#if approving || pending.length > 1}
              <button class="approve-all" type="button" aria-disabled={approving !== null} onclick={approveAll}>
                {approving ? `Approving ${Math.min(approving.done + 1, approving.total)} of ${approving.total}…` : `Approve all ${pending.length}`}
              </button>
            {/if}
            <button class="review" type="button" aria-expanded={reviewing} aria-controls="{uid}-requests"
              onclick={() => (reviewing = !reviewing)}>{reviewing ? 'Hide' : 'Review'}</button>
          </div>
        </div>
      {/if}
      {#if showBoxes}
        <ul id="{uid}-requests">
          {#each visible as request (request.id)}
            {@const decision = decisionOf(request)}
            <li data-request={request.id} class:done={decision === 'block'}>
              <a class="avatar" href="/users/{request.slug}" tabindex="-1" aria-hidden="true"><img src={request.avatarUrl} alt="" width="42" height="42" /></a>
              <div class="who">
                <a class="name" href="/users/{request.slug}">{request.name}</a>
                {#if decision === 'block'}
                  <span class="time">Blocked</span>
                {:else}
                  <time class="time" datetime={request.requestedIso} title={request.requestedAt}>{request.requestedAgo}</time>
                {/if}
              </div>
              <div class="actions">
                {#each [{ action: 'approve', label: 'Approve', svg: check }, { action: 'deny', label: 'Deny', svg: deleteIcon }, { action: 'blockRequest', label: 'Block', svg: block }] as const as choice (choice.action)}
                  <Tooltip text={choice.label}>
                    {#snippet trigger(tip)}
                      <button class={choice.label.toLowerCase()} class:off={decision === 'block' && choice.action !== 'blockRequest'} type="button" aria-label="{choice.label} {request.name}'s request"
                        aria-pressed={choice.action === 'blockRequest' ? decision === 'block' : undefined}
                        aria-disabled={relationships.busy(request.slug) || decision !== null} onclick={() => decide(request, choice.action)} {...tip}><Icon svg={decision === 'block' && choice.action === 'blockRequest' ? blockThick : choice.svg} /></button>
                    {/snippet}
                  </Tooltip>
                {/each}
              </div>
            </li>
          {/each}
        </ul>
      {/if}
    </Container>
</section>
{/if}

<style>
.inbox {
  display: flow-root;
  padding-block-end: var(--dashboard-inbox-bottom);
  background: var(--color-dashboard-inbox-bg);
  color: var(--color-text-inverse);
  container-type: inline-size;
}
h2 {
  display: flex;
  align-items: center;
  gap: var(--space-sm-inline);
  margin-block: var(--space-heading-section) var(--dashboard-inbox-heading-gap);
  color: inherit;
}
.count {
  min-inline-size: var(--dashboard-inbox-count-width);
  padding: var(--dashboard-inbox-count-padding);
  border-radius: var(--radius-dashboard-inbox-count);
  background: var(--color-dashboard-inbox-count-bg);
  color: var(--color-text-inverse);
  font-size: var(--font-size-dashboard-inbox-count);
  font-weight: var(--font-weight-headings-heavy);
  line-height: var(--line-height-headings);
  text-align: center;
  font-variant-numeric: tabular-nums;
}
.hidden {
  position: absolute;
  inline-size: 1px;
  block-size: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}
.summary,
li {
  border: var(--dashboard-border-width) solid var(--color-dashboard-inbox-box-border);
  border-radius: var(--radius-dashboard-inbox);
  background: var(--color-dashboard-inbox-box);
}
.summary {
  display: flex;
  align-items: center;
  gap: var(--dashboard-inbox-summary-gap);
  padding: var(--dashboard-inbox-summary-padding);
}
.stack {
  display: flex;
  flex-shrink: 0;
  & > * {
    inline-size: var(--dashboard-inbox-stack-avatar);
    block-size: var(--dashboard-inbox-stack-avatar);
    border-radius: 50%;
    box-shadow: 0 0 0 var(--dashboard-inbox-stack-ring) var(--color-dashboard-inbox-box);
  }
  & > * + * {
    margin-inline-start: var(--dashboard-inbox-stack-overlap);
  }
  img {
    object-fit: cover;
  }
}
.extra {
  display: grid;
  place-items: center;
  background: var(--color-dashboard-inbox-stack-extra);
  font-family: var(--font-headings);
  font-size: var(--font-size-dashboard-inbox-stack-extra);
  font-weight: var(--font-weight-headings-heavy);
}
.summary-text {
  display: grid;
  flex: 1;
  min-inline-size: 0;
  p {
    margin: 0;
    font-size: var(--font-size-dashboard-inbox-summary);
  }
  strong {
    font-family: var(--font-headings);
    font-weight: var(--font-weight-headings-heavy);
  }
}
.meta,
.time {
  color: var(--color-dashboard-inbox-muted);
  font-size: var(--font-size-dashboard-inbox-time);
}
.buttons {
  display: flex;
  flex-shrink: 0;
  gap: var(--dashboard-inbox-button-gap);
}
.approve-all,
.review {
  min-block-size: 0;
  padding: var(--space-sm-block) var(--space-sm-inline);
  border: var(--dashboard-border-width) solid var(--color-dashboard-inbox-button-border);
  border-radius: var(--radius-dashboard-inbox);
  background: none;
  color: inherit;
  font-family: var(--font-headings);
  font-size: var(--font-size-dashboard-inbox-review);
  font-weight: var(--font-weight-headings-heavy);
  text-transform: uppercase;
  cursor: pointer;
  &:hover {
    border-color: var(--color-dashboard-inbox-muted);
  }
}
.approve-all {
  border-color: var(--brand-success);
  color: var(--brand-success);
  font-variant-numeric: tabular-nums;
  &:hover:not([aria-disabled='true']) {
    border-color: var(--brand-success);
    background: var(--color-dashboard-inbox-approve-hover);
  }
  &[aria-disabled='true'] {
    cursor: progress;
  }
}
ul {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--dashboard-inbox-gap);
  margin: 0;
  padding: 0;
  list-style: none;
}
.summary + ul {
  margin-block-start: var(--dashboard-inbox-gap);
}
li {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: var(--dashboard-inbox-gap);
  min-block-size: var(--dashboard-inbox-box-height);
  padding: var(--dashboard-inbox-box-padding);
  &.done {
    border-style: dashed;
    background: none;
  }
  &.done .avatar {
    opacity: var(--dashboard-inbox-done-opacity);
  }
}
.avatar img {
  display: block;
  inline-size: var(--dashboard-inbox-avatar);
  block-size: var(--dashboard-inbox-avatar);
  border-radius: 50%;
  object-fit: cover;
}
.who {
  display: grid;
  min-inline-size: 0;
  & > * {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}
.name {
  color: inherit;
  font-family: var(--font-headings);
  font-size: var(--font-size-dashboard-inbox-name);
  font-weight: var(--font-weight-headings-heavy);
}
.actions {
  display: flex;
}
.actions button {
  display: inline-grid;
  place-items: center;
  inline-size: var(--dashboard-inbox-action-size);
  block-size: var(--dashboard-inbox-action-size);
  min-block-size: 0;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: none;
  font-size: var(--font-size-dashboard-inbox-action);
  line-height: 1;
  cursor: pointer;
  &:hover:not([aria-disabled='true']) {
    background: var(--color-dashboard-inbox-hover);
  }
  &.off {
    visibility: hidden;
  }
  &[aria-disabled='true'] {
    cursor: default;
  }
  &.approve {
    color: var(--brand-success);
  }
  &.deny {
    color: var(--brand-primary);
  }
  &.block {
    color: var(--color-dashboard-inbox-muted);
    font-size: var(--font-size-dashboard-inbox-block);
  }
}
button:focus-visible {
  outline: var(--watch-focus) solid currentColor;
  outline-offset: var(--space-xs-inline);
}
@container (width < 900px) {
  ul {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@container (width < 600px) {
  ul {
    grid-template-columns: minmax(0, 1fr);
  }
  .summary {
    flex-wrap: wrap;
  }
}
</style>
