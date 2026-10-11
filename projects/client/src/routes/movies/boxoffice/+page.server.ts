import { loadBoxOffice } from '../../../lib/charts/loadBoxOffice.ts';

export const load = ({ fetch, cookies, parent }) => loadBoxOffice({ fetch, cookies, parent });
