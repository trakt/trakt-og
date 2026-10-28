# Performance

Smooth means the same page with less work. Every rule here came from a counted win; the file in parentheses shows it.

## Cards and popovers

- **A closed popover renders its shell, not its body.** Mount the body on the first `beforetoggle` to `open` and keep it mounted. The element, its title and its anchor stay, so `aria-controls` and `anchor-name` still resolve. Focus the first choice in `toggle`, which fires after Svelte has flushed the body. (`prompt/PromptPopover.svelte`, `rating/RatingPopover.svelte`, `lists/MediaList.svelte`)
- **Nothing per card runs while hidden.** A loader, dialog or overlay a card might open mounts on first use, not with the card. A hidden `LoadingOverlay` keeps its two infinite animations running, and a closed `<dialog>` still fetches its images. (`lists/MediaList.svelte`, `media/ListRow.svelte`)
- **One observer serves every card.** Share a module-level `IntersectionObserver` or `ResizeObserver` and map elements to callbacks with a `WeakMap`. (`comments/onceInView.ts`, `discover/DiscoverLists.svelte`)

## Layout

- **Read layout where it is clean, write it later.** In a `ResizeObserver` callback, read sizes right away and defer only the state write to `requestAnimationFrame`. Svelte flushes state in a microtask between frame callbacks, so a read inside the frame forces a layout per instance. (`readmore/ReadMore.svelte`, `notes/NoteText.svelte`)
- **Batch reads and writes across instances**: unhide all, read all, then hide all. (`discover/DiscoverLists.svelte`)
- **Do cheap checks before DOM queries in global handlers.** A window `keydown` runs on every keystroke on the page. (`summary/ItemNav.svelte`)

## Paint

- **Animate `opacity` and `transform` only.** A `box-shadow` or size animation repaints every frame, and under a `backdrop-filter` it re-runs the blur too. Put the effect on a pseudo-element and fade it. (`first-night/FirstNightProgress.svelte`)

## Reactivity

- **`overlay.state()` is memoized per slices object.** Slices are replaced, never mutated, so caches keyed on a slice (`WeakMap`) never go stale. Never mutate a slice or a returned `OverlayState`. (`overlay/createOverlay.svelte.ts`)
- **Pass the season when you have it.** `overlay.state('episode', id, { show, number, episode })` is a direct lookup. Without it the overlay uses its episode index. A watch target without a season makes the watch click search for the episode first. (`shows/EpisodeList.svelte`)
- **Per-key state uses `SvelteMap`**, not a record replaced with a spread. A spread re-runs every reader on every key. (`comments/createCommentReactions.svelte.ts`)
- **Large read-only arrays use `$state.raw`** when they are only reassigned. (`lists/createListManager.svelte.ts`)
- **Keep overlay reads out of mappers.** Build view models in a `$derived` that doesn't read the overlay, and join the overlay state in a second one. (`calendars/CalendarPage.svelte`)
- **Cache `Intl` formatters by their options.** (`calendars/airTime.ts`, `utils/format/formatNumber.ts`)

## Navigation

- **Link to a page route, never to a redirect.** The client router only knows page routes, so a link to a `+server.ts` redirect is a full document reload plus a hop. Build the final URL (`lists/listPath.ts`, the viewer's own slug instead of `/users/me`). (`header/Header.svelte`, `discover/toListCard.ts`)
- **The root layout's load tracks nothing that changes between pages.** A layout that reads `route`, `url` or a param reruns on every client navigation that changes it, and so does every layout under it that calls `parent()`: a profile tab change re-sent the whole profile frame. Read such values in `untrack`. (`settings/loadViewerSession.ts`)
- **A parent layout runs whenever a child calls `parent()`**, even when the client then discards its result. Expensive extras a layout streams should start lazily on data requests (`isDataRequest`) with `utils/lazy`. (`users/loadProfileFrame.ts`)

## Requests

- **Share item-independent reads** between dialog instances with a promise per path, and never keep a failed one. (`watchnow/fetchWatchNowShared.ts`)
- **Start independent reads together.** A read that doesn't depend on a write starts with it, not after it. (`favorites/MediaFavorite.svelte`)
- **Stream the slow read, not the page.** A loader returns a section that waits on a slow read as a promise, and the page holds its place with a shimmer at its loaded size; fast reads stay awaited, so the server HTML keeps them. The profile's whole watched lists took 0.6 to 1s; streaming the boxes and Most Watched that need them cut its first byte from about 1.1s to 0.2s. Catch a streamed read that a cancelled or failed load can strand, or it's an unhandled rejection. Discover streams its premieres, month's lists and trending comments, whose reads were its slowest, behind the hero and shelves. (`users/profile/loadProfile.ts`, `discover/loadDiscover.ts`)

## Bundle

- **Watch the boot closure** (the root layout's static imports). Anything there ships on every page. `@trakt/api` reaches boot through the overlay, header search and drop note.
- **The browser build stubs `@anatine/zod-openapi`** (`src/lib/zodOpenApiShim.ts`, `vite.config.ts`). Its CommonJS build pulled a second zod into every page, and og never reads OpenAPI metadata. If a dependency upgrade starts reading it, remove the shim.
- **Images in hidden markup are `loading="lazy"`**, or desktop fetches the phone splash. (`mobile-splash/MobileSplash.svelte`)

## Measuring

- Count, don't guess: elements inside closed popovers, `document.getAnimations()` while idle, `getBoundingClientRect` calls per scroll, requests per click, boot bytes from `.svelte-kit/output/client/.vite/manifest.json`.
- Compare against the same pages on `main`, and screenshot `main` twice to find the noise floor before calling a change pixel identical.
