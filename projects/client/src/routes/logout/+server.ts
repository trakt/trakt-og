import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

/** Another name for `/signout`. */
export const GET: RequestHandler = () => redirect(302, '/signout');
