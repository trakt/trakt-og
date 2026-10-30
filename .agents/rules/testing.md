<!-- Adapted from trakt-web .agents/rules/testing.md -->

# Testing

- Vitest. Specs are colocated next to their source as `*.spec.ts`.
- Test pure functions and data mappers first: business logic and transformations.
- Test behavior, not implementation. Verify what the code does, not how.
- Mock HTTP with MSW. Never hit apiz from a test.
- Run one file while iterating: `bun run test src/lib/foo.spec.ts`. Open a draft PR early, run `bun run ci` while working, and pass it before marking the PR ready.

## Describe / It conventions

- The top-level `describe` names the unit under test, optionally prefixed by its kind:
  `describe('util: prependHttps', ...)`.
- Nested `describe` blocks group by scenario (for example `'for shows'`).
- `it` titles read as sentences starting with `'should ...'`.

## Visual checks

- Compare pages and components against the OG page, or the mock for a feature OG never had, with screenshots at 1440px.
