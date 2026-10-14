/** The native list-comment API supports all-time reactions/replies and both added-date directions. */
export const listCommentSorts = {
  likes: 'Reactions',
  replies: 'Replies',
  newest: 'Added Date',
  oldest: 'Added Date',
} as const;

/** The sort menu: oldest is Added Date flipped with the direction button. */
export const listCommentMenu = ['likes', 'replies', 'newest'] as const;
