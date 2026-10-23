/** The signed-in viewer wrote the note: their Trakt user id is its author's. A missing id on either side never matches. */
export function ownsNote(viewerId: number | null | undefined, author: { readonly id: number | null }) {
  return viewerId != null && author.id === viewerId;
}
