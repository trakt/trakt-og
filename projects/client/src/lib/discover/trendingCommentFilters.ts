/** The trending comments dropdowns: the kind of comment and the type of title, with the API's names as ids. */
export const trendingCommentFilters = {
  kinds: [
    { id: 'all', label: 'All Comments' },
    { id: 'reviews', label: 'Reviews' },
    { id: 'shouts', label: 'Shouts' },
  ],
  media: [
    { id: 'all', label: 'All Types' },
    { id: 'movies', label: 'Movies' },
    { id: 'shows', label: 'Shows' },
    { id: 'episodes', label: 'Episodes' },
  ],
} as const;
