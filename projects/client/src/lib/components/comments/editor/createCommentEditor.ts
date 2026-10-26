import type { Editor, JSONContent } from '@tiptap/core';
import { safeLink } from '../text/safeLink.ts';

export type CreateCommentEditorProps = {
  readonly element: HTMLElement;
  readonly content: JSONContent;
  readonly placeholder: string;
  readonly label: string;
  readonly describedBy?: string;
  readonly onupdate: (editor: Editor) => void;
  readonly onsubmit: () => void;
};

/**
 * The rich comment editor, loaded only once a composer opens: Tiptap's basics without underline (the comment syntax
 * has none), OG's highlight, spoiler and author styles, and links only to the hosts OG links.
 */
export async function createCommentEditor({
  element,
  content,
  placeholder,
  label,
  describedBy,
  onupdate,
  onsubmit,
}: CreateCommentEditorProps): Promise<Editor> {
  const [
    { Editor },
    { default: StarterKit },
    { Placeholder },
    { HighlightMark },
    { SpoilerMark },
    { AuthorStyle },
    { SubmitKeymap },
  ] = await Promise.all([
    import('@tiptap/core'),
    import('@tiptap/starter-kit'),
    import('@tiptap/extensions'),
    import('./HighlightMark.ts'),
    import('./SpoilerMark.ts'),
    import('./AuthorStyle.ts'),
    import('./SubmitKeymap.ts'),
  ]);

  return new Editor({
    element,
    content,
    autofocus: 'end',
    extensions: [
      StarterKit.configure({
        underline: false,
        link: {
          openOnClick: false,
          autolink: false,
          linkOnPaste: false,
          isAllowedUri: (url) => safeLink(url) !== undefined,
        },
      }),
      HighlightMark,
      SpoilerMark,
      AuthorStyle,
      SubmitKeymap.configure({ onsubmit }),
      Placeholder.configure({ placeholder }),
    ],
    editorProps: {
      attributes: {
        role: 'textbox',
        'aria-multiline': 'true',
        'aria-label': label,
        ...(describedBy ? { 'aria-describedby': describedBy } : {}),
      },
    },
    onUpdate: ({ editor }) => onupdate(editor),
  });
}
