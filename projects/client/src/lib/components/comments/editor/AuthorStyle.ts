import { Extension } from '@tiptap/core';

/** A paragraph's `~1` to `~6` author style, kept so editing a comment doesn't drop it. A new paragraph starts plain. */
export const AuthorStyle = Extension.create({
  name: 'authorStyle',
  addGlobalAttributes: () => [
    {
      types: ['paragraph'],
      attributes: {
        author: {
          default: null,
          keepOnSplit: false,
          parseHTML: (element) => Number(element.dataset.author) || null,
          renderHTML: ({ author }) => (author ? { 'data-author': author, class: `author author-${author}` } : {}),
        },
      },
    },
  ],
});
