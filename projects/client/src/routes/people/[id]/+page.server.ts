import { loadPerson } from '../../../lib/people/loadPerson.ts';

export const load = ({ fetch, locals, parent, params, request, url }) =>
  loadPerson({
    fetch,
    token: locals.token,
    parent,
    id: params.id,
    search: url.searchParams,
    languages: request.headers.get('accept-language'),
  });
