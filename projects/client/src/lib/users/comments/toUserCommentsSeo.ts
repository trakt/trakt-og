import type { ProfileUser } from '../ProfileUser.ts';
import type { userCommentMediaTypes } from './userCommentMediaTypes.ts';

type Params = {
  profile: Pick<ProfileUser, 'displayName' | 'firstName'>;
  type: keyof typeof userCommentMediaTypes;
  /** The comments the member liked, not the ones they wrote. */
  liked: boolean;
};

/** A member's comments page: "Justin Nemeth's movie liked comments". */
export function toUserCommentsSeo({ profile, type, liked }: Params): { title: string; description: string } {
  const metaType = type === 'all' ? '' : `${type.replace(/s$/, '')} `;
  return {
    title: `${profile.displayName}'s ${metaType}${liked ? 'liked ' : ''}comments`,
    description: `Check out ${profile.firstName}'s ${liked ? 'liked' : 'recent'} comments.`,
  };
}
