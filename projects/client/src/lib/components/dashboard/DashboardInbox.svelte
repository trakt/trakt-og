<!--
  The dashboard's follow requests. Up to three show as boxes, two to a row, each with Approve, Deny and Block buttons
  like the profile's request deck; from four up they fold into a summary line with an avatar stack, the newest and
  oldest dates as pills, Approve All and Review, and Review opens the boxes. The layout is picked from the count on
  load, so it doesn't switch while deciding, and a decided box stays in place, marked Approved, Denied or Blocked,
  until the next load. The summary box takes the request deck's green tint.
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
import Container from '$lib/components/container/Container.svelte';
import HeadingMark from '$lib/components/heading/HeadingMark.svelte';
import CoverPill from '$lib/components/users/CoverPill.svelte';
import RequestButton from '$lib/components/users/RequestButton.svelte';
import Icon from '$lib/icons/Icon.svelte';
import ban from '$lib/icons/regular/ban.svg?raw';
import clock from '$lib/icons/regular/clock.svg?raw';
import clockRotateLeft from '$lib/icons/regular/clock-rotate-left.svg?raw';
import userPlus from '$lib/icons/regular/user-plus.svg?raw';
import check from '$lib/icons/solid/check.svg?raw';
import xmark from '$lib/icons/solid/xmark.svg?raw';
import { followRequestSummary } from '$lib/dashboard/followRequestSummary';
import type { toFollowRequest } from '$lib/dashboard/toFollowRequest';

type Request = ReturnType<typeof toFollowRequest>;

const { requests }: { requests: readonly Request[] } = $props();
const uid = $props.id();
const relationships = createRelationshipOverlay();
const stackSize = 5;
// The API takes one write a second, so approvals go out one at a time at that pace, and a 429 waits its Retry-After.
const writes = createRequestQueue({ concurrency: 1, limit: 1, windowMs: 1000 });
let heading = $state<HTMLElement>();
let reviewing = $state(false);
let approving = $state<{ done: number; total: number } | null>(null);
const relation = (id: number) => ({ follow: 'none' as const, followsYou: false, blocked: false, requestId: id });
const decisionOf = (request: Request) => relationships.state(request.slug, relation(request.id)).decision;
const pending = $derived(requests.filter((request) => decisionOf(request) === null));
const choices = [
  { action: 'approve', decision: 'approve', tone: 'approve', label: 'Approve', done: 'Approved', icon: check },
  { action: 'deny', decision: 'deny', tone: 'deny', label: 'Deny', done: 'Denied', icon: xmark },
  { action: 'blockRequest', decision: 'block', tone: 'block', label: 'Block', done: 'Blocked', icon: ban },
] as const;
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
  // The summary line, and the button that had focus, goes once nothing is pending.
  await tick();
  if (pending.length === 0) heading?.focus();
}
async function decide(request: Request, action: 'approve' | 'deny' | 'blockRequest') {
  if (!(await userManager().getUser())?.access_token) return login();
  await send(request, action);
}
</script>

<!-- eslint-disable svelte/no-navigation-without-resolve -->
{#if requests.length > 0}
  <section class="inbox" aria-labelledby="{uid}-heading">
  <Container>
      <h2 id="{uid}-heading" tabindex="-1" bind:this={heading}>
        <HeadingMark svg={userPlus} />Follow Requests
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
            <div class="dates">
              <CoverPill><Icon svg={clock} />Newest <b>{pending.at(0)?.requestedAgo}</b></CoverPill>
              <CoverPill><Icon svg={clockRotateLeft} />Oldest <b>{pending.at(-1)?.requestedAgo}</b></CoverPill>
            </div>
          </div>
          <div class="buttons">
            {#if approving || pending.length > 1}
              <RequestButton tone="approve" icon={check} aria-disabled={approving !== null} onclick={approveAll}>
                {approving ? `Approving ${Math.min(approving.done + 1, approving.total)} of ${approving.total}…` : `Approve all ${pending.length}`}
              </RequestButton>
            {/if}
            <RequestButton tone="neutral" aria-expanded={reviewing} aria-controls="{uid}-requests"
              onclick={() => (reviewing = !reviewing)}>{reviewing ? 'Hide' : 'Review'}</RequestButton>
          </div>
        </div>
      {/if}
      {#if showBoxes}
        <ul id="{uid}-requests">
          {#each requests as request (request.id)}
            {@const decision = decisionOf(request)}
            {@const chosen = choices.find((choice) => choice.decision === decision)}
            <li class={chosen && `done ${chosen.decision}`}>
              <a class="avatar" href="/users/{request.slug}" tabindex="-1" aria-hidden="true"><img src={request.avatarUrl} alt="" width="42" height="42" /></a>
              <div class="who">
                <a class="name" href="/users/{request.slug}">{request.name}</a>
                {#if chosen}
                  <span class="state">{chosen.done}</span>
                {:else}
                  <span class="when">
                    <CoverPill title={request.requestedAt}>
                      <Icon svg={clock} /><time datetime={request.requestedIso}>{request.requestedAgo}</time>
                    </CoverPill>
                  </span>
                {/if}
              </div>
              {#if !chosen}
                <div class="actions">
                  {#each choices as choice (choice.action)}
                    <RequestButton tone={choice.tone} icon={choice.icon} aria-label="{choice.label} {request.name}'s request"
                      aria-disabled={relationships.busy(request.slug)} onclick={() => decide(request, choice.action)}>
                      {choice.label}
                    </RequestButton>
                  {/each}
                </div>
              {/if}
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
  position: relative;
  isolation: isolate;
  display: flex;
  outline: none;
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
  border-color: var(--color-dashboard-inbox-summary-border);
  background: var(--color-dashboard-inbox-summary-bg);
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
    box-shadow: 0 0 0 var(--dashboard-inbox-stack-ring) var(--color-dashboard-inbox-summary-bg);
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
.dates {
  display: flex;
  flex-wrap: wrap;
  justify-content: start;
  gap: var(--profile-pill-gap);
  margin-block-start: var(--dashboard-inbox-pills-top);
}
/* The pills hang out by their padding and border, so their icons line up with the text above. */
.dates {
  margin-inline-start: var(--dashboard-inbox-pill-outdent);
}
.state {
  color: var(--color-dashboard-inbox-muted);
  font-size: var(--font-size-dashboard-inbox-time);
}
.buttons {
  display: flex;
  flex-shrink: 0;
  gap: var(--dashboard-inbox-button-gap);
}
ul {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
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
.state {
  font-family: var(--font-headings);
  font-weight: var(--font-weight-headings-heavy);
  text-transform: uppercase;
  .approve & {
    color: var(--brand-success);
  }
  .deny & {
    color: var(--brand-primary);
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
  justify-items: start;
  gap: var(--dashboard-inbox-pills-top);
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
  gap: var(--space-sm-block);
}
@container (width < 900px) {
  ul {
    grid-template-columns: minmax(0, 1fr);
  }
}
@container (width < 600px) {
  .summary {
    flex-wrap: wrap;
  }
}
</style>
