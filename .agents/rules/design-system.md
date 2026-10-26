# Design system

- Pages use design system tokens (CSS custom properties) and existing components only.
- A new color, spacing, radius, shadow or font size becomes a token first. No inline magic numbers.
- A component a page needs that doesn't exist yet gets built as a design system component in the same PR, with its
  demo (see Demos below) and its OG screenshot in the PR.
- Styles are component-scoped. No global class soup, and no utility framework.
- Layout uses grid and flex, with container queries so a component adapts to where it's placed. Use logical properties
  and native CSS nesting.
- Dark mode uses `color-scheme` and `light-dark` tokens, not a second stylesheet.

## Demos

Every shared component has a demo at `/_design`, and the demo shows it the way the site renders it. The demos are the
design system's living reference, so they change in the same PR as the component, never later.

- **New component**: add it to the demo for its area in the same PR. If no demo fits, add a route at
  `src/routes/_design/<slug>/` and list it in `src/lib/design/designCatalog.ts` (`designCatalog.spec.ts` fails on a
  route the catalog leaves out).
- **Changed component**: a new prop, state, variant or look updates its demo in the same PR. A changed behavior updates
  the demo's notes, so they never describe code that's gone.
- **Removed use**: when a component's last real caller goes away, delete the component, its demo section, its tokens and
  any fixture only it used. Don't keep code alive for a demo.
- **Match the site**: render it with the props, wrapper, width and background real pages use. Show only states and
  variants a real page can reach. A prop or variant no page passes is dead code: remove it instead of demoing it. Props
  that only feed sample data (so a demo works offline) are the exception.
- **Build it from the shell**: each part is a `Specimen` card (`$lib/design/Specimen.svelte`), and each state inside it
  gets a `Variant` caption (Loaded, Empty, Loading, Failed...). Use `bleed` for components that bring their own page
  column. Notes say what to look for or try, in a sentence. A demo's own controls use `DemoButton` (an action),
  `DemoChoice` (pick one, like a viewer or a backdrop) and `DemoToggle` (on or off), never bare buttons, selects,
  radios or checkboxes. Page extras live in `src/lib/extras/`, outside the design system: no demos, no tokens.
- **Never touch real data**: demos run on fixtures and stub clients. The shell answers every write that leaves the site
  itself (`$lib/design/guardWrites.ts`), so a signed-in viewer can click anything; don't add props to components just
  to stop their writes.
- **Check it**: screenshot the demo at 1440px in both themes before opening the PR, and include it with the OG
  screenshot.

## Icons

Every OG icon comes from OG's own fonts, so it matches exactly. Never hand-draw one or substitute a similar icon.
1. Find the icon's exact class in the visual reference: `fa-thin fa-gear` is `thin gear`, `trakt-icon-check-thick` is
   `trakt check-thick`, `logos-icon-dts_x` is `logos dts_x`. A bare `fa fa-x` (no style class) is `solid`.
2. Run `cd projects/client && bun run icon <family> <name>`. It writes `src/lib/icons/<family>/<name>.svg`. Families: `solid`, `regular`,
   `light`, `thin`, `brands`, `kit`, `trakt`, `logos`. An alias is saved under its canonical name, and the task says so.
   Set `OG_ASSET_PATH` to a local directory containing the source fonts and stylesheets.
3. Commit the SVG as the task wrote it. Don't edit or reformat it.
4. Render it with `<Icon svg={gear} />` after `import gear from '$lib/icons/thin/gear.svg?raw'`. Add `fixedWidth` where
   OG used `fa-fw`, and `label` when the icon is the only thing saying what a control does.

When OG picks the icon at runtime (the `logos-icon-#{format}` formats, gender icons, social network brands), extract the
whole set it can pick from, not just the one your test data shows.

## Empty states

Every empty state is `EmptyState`, from `$lib/components/empty/`: a dashed outline with OG's "Nothing to see here. Move
along, move along." and at most one way out under it, as og's outline `LinkButton`. No second line of text. Never
render a blank gap or ad-hoc empty markup.

| Reason | When | Button |
|---|---|---|
| Not started | The viewer's own data has nothing yet (their watchlist, history). | Where they'd start: "Find a movie", "Find a show". On a dashboard panel, `PanelPrompt` instead: one `action`, or `picks` in welcome mode. |
| Filtered out | A search, filter, period, list type or hide setting the viewer picked leaves nothing. | What clears it: "Clear filters", "Show hidden episodes", "See all lists". The dark charts and search frames use `NoResults`, OG's hooded figure, with the same button. |
| Nothing there | There's none to show and the viewer can't change that. | None. |
| Didn't load | The fetch failed. | `LoadFailed what="{Section heading}"`: the outline in warning orange, "{Section} didn't load." and Try again. |
| Inline | Inside a menu, picker, popover, dialog or tooltip. | `EmptyNote`, one muted line; no outline. |

- The button label says what it does on its own, since there's no line explaining it ("Show hidden episodes", not
  "Show them").
- Replace the line with `title` only where it would read wrong: a calendar's empty day, a search before typing,
  LoadFailed.
- Hiding a whole panel or section is fine only when its heading would be the only thing left and nothing above
  promises it (a summary page's optional band).
