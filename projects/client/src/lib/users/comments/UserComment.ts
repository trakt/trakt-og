import type { CommentResponse } from '@trakt/api';
import type { CommentItem } from '../../components/comments/CommentItem.ts';

/** One comment beside its poster, on the profile and the comments pages. */
export type UserComment = {
  readonly comment: CommentResponse;
  readonly item: CommentItem;
  /** What phones show instead of the poster: "Breaking Bad: Pilot". */
  readonly inlineTitle: string;
  readonly poster: {
    readonly type: 'movie' | 'show' | 'season' | 'episode' | 'list';
    readonly id: number;
    readonly href: string;
    readonly title: string;
    readonly number?: string;
    readonly image?: string;
    readonly variant: 'poster' | 'screenshot';
    /** A season or episode's show, linked under the title. */
    readonly show?: { readonly text: string; readonly href: string };
    /** A season's or episode's show and season number, and an episode's number: its overlay state and Watch Now. */
    readonly seasonOf?: { readonly show: number; readonly number: number; readonly episode?: number };
    readonly rating?: number;
    readonly airedEpisodes?: number;
    /** A movie's or episode's minutes, so the watched tooltip can total the plays. */
    readonly runtime?: number;
  };
};
