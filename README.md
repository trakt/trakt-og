# OG Redux

A rebuild of the classic Trakt site for today's big screens, running entirely on the public Trakt API. It's live at [og.trakt.tv](https://og.trakt.tv).

OG Redux is a SvelteKit app forked from [trakt-web](https://github.com/trakt/trakt-web), Trakt's v3 web app. The app lives in `projects/client/`.

**Contributions are welcome.** See [AGENTS.md](AGENTS.md) for the contribution rules and [`.agents/rules/`](.agents/rules) for the design, accessibility and testing rules.

## Requirements

- [Deno](https://docs.deno.com/runtime/getting_started/installation/) 2.x. CI uses the latest 2.x release.
- Git.

trakt-web has moved to Bun. OG Redux will follow, but for now every command here runs through Deno.

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

## 2. Get the code running

1. **Clone the repository**

   ```sh
   git clone https://github.com/trakt/trakt-og.git
   cd trakt-og
   ```

2. **Install dependencies** from the lockfile

   ```sh
   deno task install
   ```

3. **Set your client ID.** Create `projects/client/.env.development` with your app's Client ID:

   ```sh
   echo "TRAKT_CLIENT_ID=<your client id>" > projects/client/.env.development
   ```

   Then copy the local Worker settings, which open every page and leave the optional keys empty:

   ```sh
   cp projects/client/.dev.vars.example projects/client/.dev.vars
   ```

4. **Start the dev server**

   ```sh
   deno task client:dev
   ```

   Open [http://localhost:5173](http://localhost:5173) and sign in from the header. Add `--port 5174` to run a second copy.

## Environment variables

| Variable           | Where                              | Needed                      | What it does                                                                                                               |
| ------------------ | ---------------------------------- | --------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `TRAKT_CLIENT_ID`  | `projects/client/.env.development` | Yes                         | Your Trakt app's client ID. It's inlined into the bundle at build time, like trakt-web. A shell export overrides the file. |
| `TRAKT_CLIENT_ID`  | `projects/client/.env.production`  | For local production builds | The og.trakt.tv app's ID, used by `client:build` and the manual `client:deploy`.                                           |
| `PUBLIC_TRAKT_API` | Shell or `.env.development`        | No                          | `production` (the default) talks to `https://apiz.trakt.tv`. `local` talks to a local API at `http://localhost:8787`.      |
| `OG_ADMIN_GATE`    | `projects/client/.dev.vars`        | Set by the example          | `off` opens every page locally. Deployed, og.trakt.tv is admin-only until launch.                                          |
| `KLIPY_API_KEY`    | `projects/client/.dev.vars`        | No                          | Turns on the GIF picker in comment composers.                                                                              |
| `GITHUB_TOKEN`     | `projects/client/.dev.vars`        | No                          | A read-only GitHub token for the about page's GitHub reads, for the higher rate limit.                                     |

`.env.development`, `.env.production` and `.dev.vars` are gitignored. `.dev.vars` is only read locally; deploys read Worker secrets instead.

## Everyday commands

Run these from the repository root.

| Command                        | What it does                                                                 |
| ------------------------------ | ---------------------------------------------------------------------------- |
| `deno task client:dev`         | Starts the dev server on port 5173.                                          |
| `deno task client:check`       | Type checks.                                                                 |
| `deno task client:test`        | Runs the tests.                                                              |
| `deno task client:build`       | Builds for production.                                                       |
| `deno task client:ci`          | Formatting, lint, types, tests and the production build: everything CI runs. |
| `deno task client:verify [pr]` | CI plus the supply chain, commit and leak checks.                            |
| `deno task client:land <pr>`   | Rebases, verifies and lands a PR, then closes its issues.                    |

To try the production build locally, run `deno task preview` in `projects/client/`. It builds, then serves the Cloudflare Worker with `wrangler dev`.

## Deploys

Every merge to main deploys og.trakt.tv through GitHub Actions, built with the `TRAKT_CLIENT_ID` repo secret. PRs land through `deno task client:land <pr>`, never straight to main. `deno task client:deploy` is a manual redeploy of main for maintainers.
