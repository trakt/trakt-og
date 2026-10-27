import { loadItemLists } from '../../../../../../../lib/itemLists/loadItemLists.ts';

export const load = ({ fetch, parent, params, url, locals }) =>
  loadItemLists({
    fetch,
    parent,
    url,
    type: params.type,
    sortBy: params.sort_by,
    sortHow: params.sort_how,
    token: locals.token,
    item: { type: 'show', id: params.id },
  });
