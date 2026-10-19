# og

A visual clone of the classic Trakt site, built with SvelteKit and Deno.
The app lives in `projects/client/` within the trakt-web fork workspace.

```sh
deno task install
deno task client:dev
```

The Trakt client ID is inlined into the bundle at build time, like trakt-web. Set it in two gitignored files in `projects/client/`:

- `.env.development`: `TRAKT_CLIENT_ID=<dev app ID>`, used by `client:dev`. The dev app's redirect URIs must include `http://localhost:5173/callback`.
- `.env.production`: `TRAKT_CLIENT_ID=<og.trakt.tv app ID>`, used by local builds and the manual `client:deploy`.

No client secret is needed. A `TRAKT_CLIENT_ID` shell export overrides both files.

Every push to main deploys og.trakt.tv through GitHub Actions, which builds with the `TRAKT_CLIENT_ID` repo secret.

Run `deno task client:ci` to check formatting, lint, types, tests and the production build.
See [AGENTS.md](AGENTS.md) for commands and contribution rules.
