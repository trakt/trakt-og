import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

/** Another name for `/signin`, with its `redirect_to`. */
export const GET: RequestHandler = ({ url }) => redirect(302, `/signin${url.search}`);
