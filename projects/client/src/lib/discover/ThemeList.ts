import type { ListCard } from './toListCard.ts';

/** One of the month's lists: its card, with this week's likes and when it last changed, for the sorts. */
export type ThemeList = ListCard & { readonly weekLikes: number; readonly updatedAt?: string };
