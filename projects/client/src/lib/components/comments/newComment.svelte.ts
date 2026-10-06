// The page's new comment form. The "Add comment" buttons open it wherever they sit, and the comment lists read what it
// posted. Browser only: the form mounts it in an effect, and this module is shared by every request on the server.
import type { CommentResponse } from '@trakt/api';

let mounted = $state(false);
let visible = $state(false);
let opened = $state(0);
let posted = $state<readonly CommentResponse[]>([]);
// Not state: only Cancel reads it, to give the focus back.
let opener: HTMLElement | undefined;

export const newComment = {
  /** A form is on the page: the viewer can comment here. */
  get available() {
    return mounted;
  },
  /** Hidden until an "Add comment" button opens it, and again once it posts or is cancelled. */
  get visible() {
    return visible;
  },
  /** Counts the "Add comment" clicks, so the form scrolls into view and takes the focus on each one. */
  get opened() {
    return opened;
  },
  /** The button that last opened the form, for Cancel to give the focus back to. */
  get opener() {
    return opener;
  },
  /** Newest first, to show above the loaded comments. */
  get posted() {
    return posted;
  },
  open(from?: HTMLElement) {
    visible = true;
    opener = from;
    opened++;
  },
  close() {
    visible = false;
  },
  add(comment: CommentResponse) {
    posted = [comment, ...posted];
  },
  /** Call from the form's effect; the cleanup forgets the page's state. */
  mount() {
    mounted = true;
    return () => {
      mounted = false;
      visible = false;
      opened = 0;
      opener = undefined;
      posted = [];
    };
  },
};
