/** One demo under `/_design`: where it sits in the nav and what it shows. */
export type DesignDemo = {
  readonly slug: string;
  readonly title: string;
  readonly summary: string;
  /** Where the demoed components live, under `$lib`. */
  readonly source: string;
};

export type DesignGroup = { readonly name: string; readonly demos: readonly DesignDemo[] };

/** Every demo, in nav order. A demo route that isn't listed here fails `designCatalog.spec.ts`. */
export const designCatalog: readonly DesignGroup[] = [
  {
    name: 'Foundations',
    demos: [
      {
        slug: 'tokens',
        title: 'Tokens',
        summary: 'Type, colors, spacing, shadows and image ratios, each a custom property in tokens.css.',
        source: 'styles',
      },
      {
        slug: 'icons',
        title: 'Icons',
        summary: "One icon per family in text, fixed width and large, plus the library logos at OG's sizes.",
        source: 'icons',
      },
      {
        slug: 'brand',
        title: 'Brand mark',
        summary: "The classic Trakt mark as each page draws it, with that page's ink, face and ground.",
        source: 'components/brand',
      },
      {
        slug: 'loader',
        title: 'Loaders',
        summary: "The page loader over a list, the shimmer bars on the home page and the dashboard's shimmer cards.",
        source: 'components/loading',
      },
    ],
  },
  {
    name: 'Controls',
    demos: [
      {
        slug: 'controls',
        title: 'Controls',
        summary:
          'Sidebar and toolbar filters, link buttons, pagination, the rating meter, empty states and the page loader.',
        source: 'components/filters',
      },
      {
        slug: 'popups',
        title: 'Popups',
        summary: 'Dialogs, dropdowns, toasts, tooltips and the Watch Now block.',
        source: 'components/dialog',
      },
      {
        slug: 'rating-line',
        title: 'Rating lines',
        summary:
          'The heart and label under a poster on the Ratings page and the Social Feed, for every rating from 1 to 10.',
        source: 'components/rating',
      },
    ],
  },
  {
    name: 'Media',
    demos: [
      {
        slug: 'media',
        title: 'Cards and rows',
        summary:
          'Summary and subpage headers, search, discover, screenshot and chart cards, quick-icon states, and list rows.',
        source: 'components/media',
      },
      {
        slug: 'summary',
        title: 'Summary sections',
        summary:
          "A movie's summary top with its action stack, subpage and list titles, people, activity, videos, comments, lists and related titles.",
        source: 'components/summary',
      },
      {
        slug: 'episode',
        title: 'Episode summary',
        summary: 'The episode title bar, community stat icons and spoiler cover.',
        source: 'components/summary',
      },
      {
        slug: 'stats',
        title: 'Media stats',
        summary: "A title's rating chart, community tiles and second opinions, in the stats page's column.",
        source: 'stats',
      },
    ],
  },
  {
    name: 'Actions',
    demos: [
      {
        slug: 'history',
        title: 'History',
        summary: 'The summary watch buttons, the poster check icons and day dividers, on real titles.',
        source: 'components/history',
      },
      {
        slug: 'collection',
        title: 'Library',
        summary: 'The library button with adding off: Plex and Jellyfin items, format logos and metadata.',
        source: 'components/collection',
      },
      {
        slug: 'favorites',
        title: 'Favorites',
        summary:
          'The summary favorite button and the stars on chart and Recently Watched cards, which share one state.',
        source: 'components/favorites',
      },
      {
        slug: 'visibility',
        title: 'Rewatch, drop and hide',
        summary: 'The dropped stamp, Not interested on recommendations, and rewatch and drop in the ••• menus.',
        source: 'components/visibility',
      },
    ],
  },
  {
    name: 'Lists and notes',
    demos: [
      {
        slug: 'lists',
        title: 'Lists',
        summary: 'The list picker, notes on posters, manage mode, the stats bar and the list dialogs.',
        source: 'components/lists',
      },
      {
        slug: 'notes',
        title: 'Notes',
        summary:
          'Notes beside their posters for each thing a note hangs on, the private notes box and the notes dialog.',
        source: 'components/notes',
      },
    ],
  },
  {
    name: 'Community',
    demos: [
      {
        slug: 'comments',
        title: 'Comments',
        summary:
          "The comment card in every state, its tags, the reaction picker, the new comment form and Discover's spotlight.",
        source: 'components/comments',
      },
      {
        slug: 'users',
        title: 'Profiles',
        summary:
          'The profile frame in every follow, watching and lock state, the favorites panel, charts, most watched and user cards.',
        source: 'components/users',
      },
      {
        slug: 'profile-boxes',
        title: 'Profile boxes',
        summary: "The profile's stat boxes on four made-up members, with each box's score.",
        source: 'users/profile/boxes',
      },
      {
        slug: 'progress',
        title: 'Progress',
        summary:
          'The progress page as its owner sees it: views, status menus, seasons that load as they open, and the list filter.',
        source: 'users/progress',
      },
    ],
  },
  {
    name: 'Dashboard',
    demos: [
      {
        slug: 'dashboard-frame',
        title: 'Greeting and recaps',
        summary: 'The greeting with its stats panel, the recap ribbon and follow requests.',
        source: 'components/dashboard',
      },
      {
        slug: 'first-night',
        title: 'First night',
        summary:
          'What a new member sees in place of the greeting: the welcome wall and its reel, the getting-started pill and the corner nudges.',
        source: 'components/first-night',
      },
      {
        slug: 'dashboard',
        title: 'Panels',
        summary: 'Every dashboard panel loaded, empty, loading and failed, then with saved settings.',
        source: 'components/dashboard',
      },
    ],
  },
  {
    name: 'Site',
    demos: [
      {
        slug: 'header',
        title: 'Header and footer',
        summary:
          "The glass top bar for each viewer, a new member's getting-started pill and each backdrop, its search and menus, and the footer.",
        source: 'components/header',
      },
      {
        slug: 'calendars',
        title: 'Calendar',
        summary: 'My Shows & Movies as a signed-in viewer sees it, on a sample of the public feed.',
        source: 'calendars',
      },
      {
        slug: 'search',
        title: 'Search results',
        summary: 'The real search page on a live search, in each view and artwork the sidebar offers.',
        source: 'search',
      },
      {
        slug: 'about',
        title: 'About',
        summary:
          "The about page's team panel with its rolling totals, and the issue columns loaded, empty, loading and failed.",
        source: 'about',
      },
      {
        slug: 'mobile-splash',
        title: 'Mobile splash',
        summary: 'What phones, narrow windows and upright tablets get instead of the site.',
        source: 'components/mobile-splash',
      },
      {
        slug: 'error-pages',
        title: 'Error pages',
        summary:
          'The full-screen pages for a missing page, a broken one, the Trakt API failing and losing the connection.',
        source: 'components/error',
      },
    ],
  },
];
