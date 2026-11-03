/** trakt-web's `media-action.add-comment` content type: a GIF alone is a comment of its own. */
export function toCommentContentType(text: string, hasGif: boolean): 'text' | 'gif' | 'text-and-gif' {
  if (!hasGif) return 'text';
  if (!text.trim()) return 'gif';
  return 'text-and-gif';
}
