<script lang="ts">
import AboutIssues from '$lib/about/AboutIssues.svelte';
import AboutTeam from '$lib/about/AboutTeam.svelte';
import type { AboutMemberPick } from '$lib/about/pickAboutTeam';
import Specimen from '$lib/design/Specimen.svelte';
import Variant from '$lib/design/Variant.svelte';

const PLACEHOLDERS = 'https://media.trakt.tv/hotlink-ok/placeholders/medium';
const FANART = 'https://media.trakt.tv/images/shows/000/099/080/fanarts/medium/a049f455c1.jpg.webp';

const favorite = (key: string, title: string, year: number) => ({
  key,
  title,
  year,
  href: `/shows/${key}`,
  poster: null,
  fanart: FANART,
});
const team: AboutMemberPick[] = [
  {
    slug: 'leela',
    username: 'leela',
    name: 'Turanga Leela',
    avatar: `${PLACEHOLDERS}/leela.png`,
    location: 'New New York, Earth',
    since: 2010,
    favorites: [favorite('futurama', 'Futurama', 1999), favorite('the-wire', 'The Wire', 2002)],
    episodes: 98_412,
    movies: 6_210,
    cover: FANART,
  },
  {
    slug: 'fry',
    username: 'fry',
    name: 'Philip J. Fry',
    avatar: `${PLACEHOLDERS}/fry.png`,
    location: null,
    since: 2012,
    favorites: [],
    episodes: 52_248,
    movies: 7_416,
    cover: null,
  },
];

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

<Specimen title="Team" bleed
  note="The team's totals roll up as they come into view. Pick someone in the roster, or use the arrow keys, to switch the panel.">
  <div class="page">
    <AboutTeam {team} />
  </div>
</Specimen>

<Specimen title="Issues"
  note="Each column at the issues sidebar's width, on the page's own background, in the picked theme.">
  <div class="page columns">
    <Variant label="Loaded">
      <AboutIssues {open} {closed} loading={false} />
    </Variant>
    <Variant label="Empty">
      <AboutIssues open={none} closed={none} loading={false} />
    </Variant>
    <Variant label="Loading">
      <AboutIssues open={null} closed={null} loading />
    </Variant>
    <Variant label="GitHub failed, so nothing shows">
      <AboutIssues open={null} closed={null} loading={false} />
    </Variant>
  </div>
</Specimen>

<style>
/* The about page's own background and text, in both themes. */
.page {
  display: flow-root;
  background-color: var(--color-home-bg);
  color: var(--color-home-text);
}

.columns {
  display: grid;
  grid-template-columns: repeat(auto-fill, var(--about-log-columns-side));
  gap: var(--gutter);
  align-items: start;
  inline-size: 100%;
  padding: var(--gutter);

  & :global(figcaption) {
    color: var(--color-home-muted);
  }
}
</style>
