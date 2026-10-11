import { loadBoxOffice } from '../../../lib/boxoffice/loadBoxOffice.ts';

export const load = ({ fetch, cookies, parent }) => loadBoxOffice({ fetch, cookies, parent });
