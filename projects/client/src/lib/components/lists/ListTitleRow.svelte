<!--
  A list page's title row, on a list and a smart list alike: the name as a link with its tags after it, and the
  viewer's actions on the right. The page passes its own tags (each in a `.tag`, or the collaborators chip in a
  `.title-chip`) and actions, which take this row's look by class: icons as `.action` buttons or links, with `.edit`,
  `.report`, `.progress`, `.leave` or `.manage` (lit with `.active`), a `.delete` holding its ManageConfirm and a
  `.share` holding its ShareButton, and outline text buttons from an `.action` with an `.action-text` label. Managing
  washes it green.
    <ListTitleRow id="list-title" name={list.name} href={list.href} {tags} {actions} />
-->
<script lang="ts">
import type { Snippet } from 'svelte';
import Container from '#lib/components/container/Container.svelte';

interface Props {
  /** The heading's id, for the section's label. */
  id: string;
  name: string;
  href: string;
  /** Owner or collaborator manage mode: the row's green wash. */
  managing?: boolean;
  /** No description band follows, so a rule in the band's color sets the row off from the posters. */
  ruled?: boolean;
  tags?: Snippet;
  actions?: Snippet;
}

const { id, name, href, managing = false, ruled = false, tags, actions }: Props = $props();
</script>

<!-- The page builds the list's href. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->
<section class={['title-row', { managing, ruled }]} aria-labelledby={id}>
  <Container>
    <div class="title-bar">
      <h2 {id}>
        <a class="list-title" {href}>{name}</a>{#if tags}<span class="tags">{@render tags()}</span>{/if}
      </h2>
      {#if actions}<div class="actions">{@render actions()}</div>{/if}
    </div>
  </Container>
</section>

<style>
.title-row {
  padding: var(--list-title-padding);
  background-color: var(--color-surface);
  transition: background-color var(--transition-list-card);

  /* A green wash while managing, Done's, so the swapped-in actions read as a mode. */
  &.managing {
    background-color: var(--color-list-manage-row-bg);
  }

  &.ruled {
    border-block-end: 1px solid var(--color-subnav-text-bg);
  }
}

.title-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  column-gap: var(--gutter);
}

h2 {
  flex: 1 1 auto;
  min-inline-size: 0;
  margin: var(--list-title-heading-margin);
  font-family: var(--font-headings);
  font-size: var(--font-size-h4);
  font-weight: var(--font-weight-headings);
}

.list-title {
  color: inherit;
  text-decoration: none;

  &:is(:hover, :focus-visible) {
    color: var(--color-link);
  }
}

/*
  The tags and the collaborators chip after the name, spaced like a list row's. A flex group, so the spaces between
  them in the markup don't add the heading's word spacing.
*/
.tags {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--list-title-pill-gap);
  margin-inline-start: var(--list-title-pill-gap);
  vertical-align: middle;
}

.tags :global(:is(.tag, .title-chip)) {
  display: inline-flex;
}

.actions {
  display: flex;
  align-items: center;
  gap: var(--space-list-title-actions);
}

/*
  The icons as on a list row: each in a rounded box that fills on hover, like a comment's tools. Separate selectors,
  not one :is(), so each keeps its own specificity and the colors and outline buttons below still win.
*/
.actions :global(.action),
.actions :global(.delete .confirm > button),
.actions :global(.share button) {
  display: inline-grid;
  place-items: center;
  inline-size: var(--comment-tool-size);
  block-size: var(--comment-tool-size);
  min-block-size: 0;
  padding: 0;
  border: 0;
  border-radius: var(--radius-comment-tool);
  background: none;
  color: inherit;
  font-size: var(--font-size-list-row-action);
  line-height: 1;
  text-decoration: none;
  transition: opacity 0.5s, background-color var(--transition-comment-quiet);
}

/* Lit Done keeps its own green. */
.actions :global(.action:hover:not([aria-disabled='true'], .active)),
.actions :global(.delete .confirm > button:hover:not([aria-disabled='true'])),
.actions :global(.share button:hover:not([aria-disabled='true'])) {
  background-color: var(--color-comment-chip);
}

.actions :global(.action[aria-disabled='true']) {
  cursor: default;
}

.actions :global(.action) {
  color: var(--color-stat-noun);
}

/* Manage, Progress and the like: outline buttons that match the toolbar's controls. */
.actions :global(.action:has(.action-text)) {
  display: inline-flex;
  align-items: center;
  gap: var(--space-control-caret);
  inline-size: auto;
  min-block-size: var(--control-height);
  padding: 0 var(--space-control-inline);
  border: 1px solid var(--color-control-border);
  border-radius: var(--radius-control);
  color: var(--color-control-text);
  font-size: var(--font-size-tool-icon-small);
  transition: background-color 0.2s, border-color 0.2s;
}

.actions :global(.action:has(.action-text):is(:hover, :focus-visible):not(.active)) {
  border-color: var(--color-control-border-hover);
  background-color: var(--color-control-hover-bg);
  color: var(--color-control-text);
}

.actions :global(.action-text) {
  font-family: var(--font-headings);
  font-size: var(--font-size-control);
  font-weight: var(--font-weight-control);
}

/* OG faded the flag in while the pointer was over the title row. */
.actions :global(.report) {
  opacity: 0;
}

.title-row:hover .actions :global(.report),
.actions :global(.report:focus-visible) {
  opacity: 1;
}

.actions :global(.edit) {
  color: var(--color-list-edit);
}

.actions :global(.delete) {
  color: var(--color-list-delete);
}

/* An outline button like Manage, in red: it takes the viewer off the list. */
.actions :global(.action.leave) {
  border-color: var(--color-list-leave-border);
  color: var(--color-list-leave-text);
}

.actions :global(.action.leave:is(:hover, :focus-visible)) {
  border-color: var(--color-list-delete);
  background-color: var(--color-list-leave-hover-bg);
  color: var(--color-list-leave-text);
}

.actions :global(.action.leave > :first-child) {
  color: var(--color-list-delete);
}

.actions :global(.share) {
  color: var(--color-action-share);
}

.actions :global(.manage) {
  cursor: pointer;
}

/* On, Manage reads Done in green: away from Delete's red, the way out of the mode. */
.actions :global(.manage.active) {
  border-color: var(--color-mode-done-border);
  background-color: var(--color-mode-done-bg);
  color: var(--color-mode-done-text);
}

.actions :global(.manage.active:is(:hover, :focus-visible)) {
  border-color: var(--color-mode-done);
  background-color: var(--color-mode-done-bg-hover);
  color: var(--color-mode-done-text);
}

/* OG kept only the icons on tablets and phones. */
@media (width < 992px) {
  .actions :global(.action-text) {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .title-row,
  .actions :global(.manage svg),
  .actions :global(.report) {
    transition: none;
  }
}
</style>
