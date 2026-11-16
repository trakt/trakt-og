import { loadParentalGuidePage } from '../../../../lib/parental/loadParentalGuidePage.ts';

export const load = ({ fetch, locals, parent, params }) =>
  loadParentalGuidePage({ fetch, token: locals.token, parent, item: { type: 'show', id: params.id } });
