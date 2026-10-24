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
  column. Notes say what to look for or try, in a sentence.
- **Never touch real data**: demos run on fixtures and stub clients. The shell answers every write that leaves the site
  itself (`$lib/design/guardWrites.ts`), so a signed-in viewer can click anything; don't add props to components just
  to stop their writes.
- **Check it**: screenshot the demo at 1440px in both themes before opening the PR, and include it with the OG
  screenshot.

## Icons

Every OG icon comes from OG's own fonts, so it matches exactly. Never hand-draw one or substitute a similar icon.

1. Find the icon's exact class in the visual reference: `fa-thin fa-gear` is `thin gear`, `trakt-icon-check-thick` is
   `trakt check-thick`, `logos-icon-dts_x` is `logos dts_x`. A bare `fa fa-x` (no style class) is `solid`.
2. Run `cd projects/client && deno task icon <family> <name>`. It writes `src/lib/icons/<family>/<name>.svg`. Families: `solid`, `regular`,
   `light`, `thin`, `brands`, `kit`, `trakt`, `logos`. An alias is saved under its canonical name, and the task says so.
   Set `OG_ASSET_PATH` to a local directory containing the source fonts and stylesheets.
3. Commit the SVG as the task wrote it. Don't edit or reformat it.
4. Render it with `<Icon svg={gear} />` after `import gear from '$lib/icons/thin/gear.svg?raw'`. Add `fixedWidth` where
   OG used `fa-fw`, and `label` when the icon is the only thing saying what a control does.

When OG picks the icon at runtime (the `logos-icon-#{format}` formats, gender icons, social network brands), extract the
whole set it can pick from, not just the one your test data shows.
