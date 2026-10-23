<script lang="ts">
import AboutIssues from '$lib/about/AboutIssues.svelte';

const issue = (number: number, title: string, label: string | null, at: string) => ({ number, title, label, at });

const open = {
  total: 1204,
  issues: [
    issue(
      1159,
      'Hand-hold new members: welcome wall, empty-panel prompts and a getting-started checklist',
      null,
      '2026-10-22T10:00:00Z',
    ),
    issue(122, 'Sidebar content reflows while it expands from the collapsed rail', 'polish', '2026-10-14T10:00:00Z'),
    issue(109, 'Renew an expired access token when the tab regains focus', 'bug', '2026-10-09T10:00:00Z'),
    issue(91, 'Watch button: remove a single play from the remove popover', 'enhancement', '2026-10-07T10:00:00Z'),
    issue(7, 'Validate the remaining API responses', 'enhancement', '2026-10-01T10:00:00Z'),
  ],
};
const closed = {
  total: 37,
  issues: [
    issue(150, "Person page: celebrate a person's birthday", 'enhancement', '2026-10-21T10:00:00Z'),
    issue(94, 'Better-looking toast messages', 'enhancement', '2026-10-19T10:00:00Z'),
  ],
};
const none = { total: 0, issues: [] };
</script>

<svelte:head>
  <title>About - Trakt</title>
</svelte:head>

<div class="demo">
  <section>
    <h2>Issues</h2>
    <AboutIssues {open} {closed} loading={false} />
  </section>
  <section>
    <h2>No issues</h2>
    <AboutIssues open={none} closed={none} loading={false} />
  </section>
  <section>
    <h2>Loading</h2>
    <AboutIssues open={null} closed={null} loading />
  </section>
</div>

<style>
.demo {
  display: grid;
  grid-template-columns: repeat(3, var(--about-log-columns-side));
  gap: var(--gutter);
  align-items: start;
  padding: calc(var(--header-height) + var(--gutter)) var(--gutter) var(--gutter);
  background-color: var(--color-home-bg);
  color: var(--color-home-text);
  color-scheme: dark;
}

section {
  background-color: transparent;
}

h2 {
  margin-block: 0 var(--gutter);
  font-size: var(--font-size-h4);
}
</style>
