# og

og is the classic Trakt site, live at og.trakt.tv and now maintained and extended. It is built with SvelteKit and Bun on
the trakt-web fork layout.
The app lives in `projects/client/`. Shared code and design rules live in `.agents/rules/`.

## Commands

Run these from the repository root:
- `bun run install:frozen`: install pinned dependencies from the lockfile.
- `bun run client:setup <client id>`: write the local settings for a Standard Trakt app.
- `bun run client:dev`: start the dev server.
- `bun run client:ci`: formatting, lint, types, tests and production build.
- `bun run client:check`: type checks.
- `bun run client:test`: tests.
- `bun run client:build`: production build.
- `bun run client:seo-check [url]`: check what crawlers and link previews see (defaults to the local dev server).

Run these from `projects/client/`:
- `bun run bump [--dry-run]`: move every pin to its newest release, keep the ones that pass CI, and write the PR title
  and body for the upgrade. The Dependency Bump workflow runs it weekly, and by hand from "Run workflow", and opens the
  result as a draft PR.
- `bun run lint` and `bun run format`: ESLint, and Biome formatting with lint fixes.
- `bun run icon <family> <name>`: extract one OG icon into `src/lib/icons/`.
- `bun run emoji`: rebuild the emoji shortname table.
- `GEO_DATA_PATH=<dir> bun run world-map`: rebuild the home page's world map data from the source files in `<dir>`.

## Hard rules

- Agents open draft PRs and get them reviewed and green; Sean or Justin marks them ready and merges. Agents never merge,
  mark PRs ready, or push to main.
- Use the latest stable dependencies, pinned to exact versions. Review and validate upgrades.
- Desktop first. Match the classic layout at 1440px; smaller screens down to tablets must be usable. Phones get the mobile splash instead.
- Pages OG had stay faithful to OG. A feature OG never had builds on OG's look with existing tokens and components,
  from a mock: ask for one, and a designer makes it when the work is delegated.
- Follow `.agents/rules/design-system.md` and the matching rules in `.agents/rules/` before changing code.
- Adding, changing or removing a shared component updates its demo at `/_design` in the same PR (`design-system.md`, Demos).
- Follow the accessibility and testing rules in `.agents/rules/a11y.md` and `.agents/rules/testing.md`.
- Merging to main deploys og.trakt.tv through GitHub Actions. A redeploy of main is "Run workflow" on CI from main,
  for humans only. Agents never run wrangler deploys.

## Working an issue

- The board is [trakt/trakt-og's issues](https://github.com/trakt/trakt-og/issues). Use GitHub's standard labels (`bug`, `enhancement`, `documentation`, etc.) plus `allowlist-change`.
- Assignment is ownership: take the issue you are handed with `gh issue edit N --repo trakt/trakt-og --add-assignee @me`. Without a specific issue, take the oldest open issue with no assignee. Never pick an assigned issue. One agent, one issue; when agents share a GitHub login, the person or orchestrator starting them hands each its own issue.
- Work in a worktree off `origin/main`. Open a draft PR early. When it's for an issue, put `Closes #N` in its body; GitHub closes the issue on merge. Keep PR titles, bodies, commits and comments public-safe; never include private implementation details or local paths.
- Build per `AGENTS.md` and `.agents/rules/`, run `bun run client:ci` while working, then get the PR reviewed and its checks green (CI, commits, supply chain and the leak check). Sean or Justin merges it.
- For a bug, reproduce it first, write a failing spec, fix the root cause and keep the spec.
- Split an issue that mixes a bug and a feature into one issue each.
- A bad deploy is fixed by a revert PR, which merges like any other.
- If you need a human, comment on the issue with what's needed, unassign yourself and stop. If you give up, leave a one-line reason and unassign yourself.
- If part of an issue has no API path and no other workable way, cut that part, explain the cut in the PR and ship the rest.
