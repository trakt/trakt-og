/** One demo under `/_design`: where it sits in the nav and what it shows. */
export type DesignDemo = {
  readonly slug: string;
  readonly title: string;
  readonly summary: string;
  /** Where the demoed components live, under `$lib`. */
  readonly source: string;
  /** Draws the site header and footer itself, so it runs full width with only a small way back to the shell. */
  readonly page?: boolean;
  /** Sets the page theme itself, so the shell's theme switch stays out of its way. */
  readonly ownTheme?: boolean;
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
        summary: "One icon per family, extracted from OG's fonts, in text, fixed width and large.",
        source: 'icons',
      },
      {
        slug: 'brand',
        title: 'Brand mark',
        summary: 'The classic Trakt mark in each ink and face a page draws it with.',
        source: 'components/brand',
      },
      {
        slug: 'loader',
        title: 'Loaders',
        summary: 'The liquid-fill loader at every size, its reduced-motion breathe, and the shimmer bars.',
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
        summary: 'Link buttons, pagination, pill tabs, filters, the rating meter, and empty and loading states.',
        source: 'components/filters',
      },
      {
        slug: 'popups',
        title: 'Popups',
        summary: 'Dialogs, dropdowns, toasts, tooltips and the Watch Now block.',
        source: 'components/dialog',
      },
      {
        slug: 'slider',
        title: 'Fanart slider',
        summary: "Discover's ranked slider with keyboard keys, and the bare one a showcase uses.",
        source: 'components/slider',
      },
      {
        slug: 'rating-line',
        title: 'Rating lines',
        summary: 'The heart and label under a Social Feed poster, for every rating from 1 to 10.',
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
        summary: 'Poster, screenshot and fanart cards, every quick-icon state, and list rows, on trending shows.',
        source: 'components/media',
      },
      {
        slug: 'summary',
        title: 'Summary sections',
        summary: 'Title tags, the action stack, people, activity, videos, comments, lists and related titles.',
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
        summary: "A title's rating chart, community tiles, second opinions and the rolling number.",
        source: 'stats',
      },
      {
        slug: 'releases',
        title: 'Release dates',
        summary: "A movie's releases by country, the original country flagged.",
        source: 'movies',
      },
    ],
  },
  {
    name: 'Actions',
    demos: [
      {
        slug: 'history',
        title: 'History',
        summary: 'The watch buttons and poster icon, their date and remove popovers, and day dividers.',
        source: 'components/history',
      },
      {
        slug: 'collection',
        title: 'Library',
        summary: 'Collecting with metadata, the format logos, and libraries synced from Plex and Jellyfin.',
        source: 'components/collection',
      },
      {
        slug: 'favorites',
        title: 'Favorites',
        summary: 'The summary star and the poster stars, which share one favorite state.',
        source: 'components/favorites',
      },
      {
        slug: 'visibility',
        title: 'Rewatch, drop and hide',
        summary: 'The visibility controls on their own and on poster and fanart cards.',
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
        summary: 'Note cards for each thing a note hangs on, the private notes box and the notes dialog.',
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
        summary: 'The comment card in every state, its tags, the reaction picker and the composer.',
        source: 'components/comments',
      },
      {
        slug: 'users',
        title: 'Profiles',
        summary: 'The profile frame in every follow and watching state, charts, most watched and user cards.',
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
        summary: 'The progress page as its owner sees it: views, status menus and season lines.',
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
        slug: 'dashboard',
        title: 'Panels',
        summary: 'Every dashboard panel loaded, empty, loading and failed, then with saved settings.',
        source: 'components/dashboard',
      },
      {
        slug: 'dashboard-actions',
        title: 'Up Next cards',
        summary: "An Up Next card's states: next episode, refreshing, returning and ended.",
        source: 'components/media',
      },
    ],
  },
  {
    name: 'Site',
    demos: [
      {
        slug: 'header',
        title: 'Header and footer',
        summary: 'The glass top bar for each viewer and backdrop, its search and menus, and the footer.',
        source: 'components/header',
        page: true,
        ownTheme: true,
      },
      {
        slug: 'calendars',
        title: 'Calendar',
        summary: 'My Shows & Movies as a signed-in viewer sees it, on a sample of the public feed.',
        source: 'calendars',
        page: true,
      },
      {
        slug: 'search',
        title: 'Search results',
        summary: 'The real search page; ?image= picks the image type and ?type= the tab.',
        source: 'search',
        page: true,
      },
      {
        slug: 'about',
        title: 'About issues',
        summary: "The about page's open and closed issue columns, loaded, empty and loading.",
        source: 'about',
      },
      {
        slug: 'mobile-splash',
        title: 'Mobile splash',
        summary: 'What phones, narrow windows and upright tablets get instead of the site.',
        source: 'components/mobile-splash',
      },
    ],
  },
];
