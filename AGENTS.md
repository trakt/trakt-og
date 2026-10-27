# og

og is a visual clone of the classic Trakt site, built with SvelteKit and Bun on the trakt-web fork layout.
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
- `bun run client:verify [pr]`: CI, supply chain, commit and leak checks.
- `bun run client:land <pr>`: rebase, verify and land a PR, then close its issues.
- `bun run client:seo-check [url]`: check what crawlers and link previews see (defaults to the local dev server).
- `bun run client:deploy`: manual redeploy of main from your machine. Merges to main deploy automatically.

## Hard rules

- Never push to main. PRs land only via `bun run client:land <pr>`, never directly with `gh pr merge`.
- Use the latest stable dependencies, pinned to exact versions. Review and validate upgrades.
- Desktop first. Match the classic layout at 1440px; smaller screens down to tablets must be usable. Phones get the mobile splash instead.
- Clone the UI, not the code. Rebuild with this app's components and CSS.
- Follow `.agents/rules/design-system.md` and the matching rules in `.agents/rules/` before changing code.
- Adding, changing or removing a shared component updates its demo at `/_design` in the same PR (`design-system.md`, Demos).
- Follow the accessibility and testing rules in `.agents/rules/a11y.md` and `.agents/rules/testing.md`.
- Merging to main deploys og.trakt.tv through GitHub Actions. Agents never run `client:deploy` or wrangler deploys.

## Working an issue

- The board is [trakt/og's issues](https://github.com/trakt/og/issues). Use GitHub's standard labels (`bug`, `enhancement`, `documentation`, etc.) plus `allowlist-change`.
- Assignment is ownership: take the issue you are handed with `gh issue edit N --repo trakt/og --add-assignee @me`. Without a specific issue, take the oldest open issue with no assignee. Never pick an assigned issue. One agent, one issue; when agents share a GitHub login, the person or orchestrator starting them hands each its own issue.
- Work in a worktree off `origin/main`. Open a draft PR early with `Closes #N` in its body. Keep PR titles, bodies, commits and comments public-safe; never include private implementation details or local paths.
- Build per `AGENTS.md` and `.agents/rules/`, run `bun run client:ci` while working, then ship with `bun run client:land <pr>`: rebase, verify (including the leak check), merge the verified commit and close the issue. For a process change without an issue, use a `No issue: <why>` line in the PR body.
- If you need a human, comment on the issue with what's needed, unassign yourself and stop. If you give up, leave a one-line reason and unassign yourself.
- If part of an issue has no API path and no other workable way, cut that part, explain the cut in the PR and ship the rest.
