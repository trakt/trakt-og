// OG's trailing `/:sort_how` is accepted and ignored: the API has no direction.
import { loadItemLists } from '../../../../../../../lib/itemLists/loadItemLists.ts';

export const load = ({ fetch, parent, params, url, locals }) =>
  loadItemLists({
    fetch,
    parent,
    url,
    type: params.type,
    sortBy: params.sort_by,
    token: locals.token,
    item: { type: 'person', id: params.id },
  });
