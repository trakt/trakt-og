/** The API path of a personal list's items, under its owner: collaborators read and write there too. */
export const listItemsPath = (owner: string, list: number | string) =>
  `/users/${encodeURIComponent(owner)}/lists/${encodeURIComponent(list)}/items`;
