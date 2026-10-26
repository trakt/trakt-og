# OG Redux

A rebuild of the classic Trakt site for today's big screens, running entirely on the public Trakt API. It's live at [og.trakt.tv](https://og.trakt.tv).

OG Redux is a SvelteKit app forked from [trakt-web](https://github.com/trakt/trakt-web), Trakt's v3 web app. The app lives in `projects/client/`.

**Contributions are welcome.** See [AGENTS.md](AGENTS.md) for the contribution rules and [`.agents/rules/`](.agents/rules) for the design, accessibility and testing rules.

## Requirements

- [Bun](https://bun.com/docs/installation) 1.4 or newer. CI pins 1.4.4.
- [Node.js](https://nodejs.org/) 24. Vite, Vitest and svelte-check run on it.
- Git.

## 1. Create a Trakt app

OG Redux signs in with Trakt in the browser (OAuth with PKCE), so it only needs a client ID. There's no client secret.
1. Go to the [Trakt developer portal](https://developer.trakt.tv/apps/new) and create a new app.
2. Under its redirect URIs, add one per line:
   - `http://localhost:5173/callback`
   - `http://localhost:5174/callback` (a second checkout or worktree on the next port)
3. Under its JavaScript (CORS) origins, add one per line:
   - `http://localhost:5173`
   - `http://localhost:5174`
4. Save it and copy its **Client ID**.

A new app is a Standard app. The setup below is ready for one, and doesn't need Developer Premium. See [Standard and Premium apps](#standard-and-premium-apps) for the parts of the site it can't load.

## 2. Get the code running

1. **Clone the repository**

   ```sh
   git clone https://github.com/trakt/trakt-og.git
   cd trakt-og
   ```

2. **Install dependencies** from the lockfile

   ```sh
   bun run install:frozen
   ```

3. **Set up your local settings** with your app's Client ID. This works the same in every shell, Windows included:

   ```sh
   bun run client:setup <your client id>
   ```

   It creates `projects/client/.env.development` from `.env.example`, which points og at `api.trakt.tv` for a Standard app (`PUBLIC_TRAKT_API=standard`), and adds your client ID. Run it again to change the ID. It also copies `.dev.vars.example` to `.dev.vars`, which opens every page locally and leaves the optional keys empty. With a Premium app, you can set `PUBLIC_TRAKT_API=production` in `.env.development` to use `apiz.trakt.tv`.

4. **Start the dev server**

   ```sh
   bun run client:dev
   ```

   Open [http://localhost:5173](http://localhost:5173) and sign in from the header. Add `--port 5174` to run a second copy.

## Environment variables

| Variable           | Where                              | Needed                      | What it does                                                                                                                                                                                                                                        |
| ------------------ | ---------------------------------- | --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `TRAKT_CLIENT_ID`  | `projects/client/.env.development` | Yes                         | Your Trakt app's client ID. It's inlined into the bundle at build time, like trakt-web. A shell export overrides the file.                                                                                                                          |
| `TRAKT_CLIENT_ID`  | `projects/client/.env.production`  | For local production builds | The og.trakt.tv app's ID, used by `client:build` and the manual `client:deploy`.                                                                                                                                                                    |
| `PUBLIC_TRAKT_API` | Shell or `.env.development`        | Set by the example          | `standard`, the example's, talks to `https://api.trakt.tv`, for Standard apps. `production`, the default when unset and og.trakt.tv's, talks to `https://apiz.trakt.tv`, for Premium apps. `local` talks to a local API at `http://localhost:8787`. |
| `OG_ADMIN_GATE`    | `projects/client/.dev.vars`        | Set by the example          | `off` opens every page locally. Deployed, og.trakt.tv is admin-only until launch.                                                                                                                                                                   |
| `KLIPY_API_KEY`    | `projects/client/.dev.vars`        | No                          | Turns on the GIF picker in comment composers.                                                                                                                                                                                                       |
| `GITHUB_TOKEN`     | `projects/client/.dev.vars`        | No                          | A read-only GitHub token for the about page's GitHub reads, for the higher rate limit.                                                                                                                                                              |

`.env.development`, `.env.production` and `.dev.vars` are gitignored. `.dev.vars` is only read locally; deploys read Worker secrets instead.

## Standard and Premium apps

The Trakt API serves Standard apps on `https://api.trakt.tv` and Premium apps on `https://apiz.trakt.tv`. `.env.example` sets `PUBLIC_TRAKT_API=standard` for a Standard app. In dev, og logs a hint when apiz refuses your client ID.

Some routes are only open to Trakt's own apps, so neither a Standard nor a Premium app can load them. og hides what's built on them and says so once in the browser console. The rest of the page works:
- Where to Watch, under the poster, and the Watch now buttons that open it.
- Streaming service filters, and the streaming services in Tune your picks.
- The dashboard's Social Feed.
- List collaborators, in the list editor.

Private Notes, watchlist buttons, "on a list" badges and the list picker for seasons and episodes fall back to reads every app may make.

Standard apps also get lower rate limits. When the API rate limits you, the page or section says so and offers Try again, and you stay signed in.

## Everyday commands

Run these from the repository root.

| Command                      | What it does                                                                 |
| ---------------------------- | ---------------------------------------------------------------------------- |
| `bun run client:setup <id>`  | Writes the local settings for your Trakt app's client ID.                    |
| `bun run client:dev`         | Starts the dev server on port 5173.                                          |
| `bun run client:check`       | Type checks.                                                                 |
| `bun run client:test`        | Runs the tests.                                                              |
| `bun run client:build`       | Builds for production.                                                       |
| `bun run client:ci`          | Formatting, lint, types, tests and the production build: everything CI runs. |
| `bun run client:verify [pr]` | CI plus the supply chain, commit and leak checks.                            |
| `bun run client:land <pr>`   | Rebases, verifies and lands a PR, then closes its issues.                    |

To try the production build locally, run `bun run preview` in `projects/client/`. It builds, then serves the Cloudflare Worker with `wrangler dev`.

## Deploys

Every merge to main deploys og.trakt.tv through GitHub Actions, built with the `TRAKT_CLIENT_ID` repo secret. PRs land through `bun run client:land <pr>`, never straight to main. `bun run client:deploy` is a manual redeploy of main for maintainers.
