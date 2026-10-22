import { loadDashboard } from '../../lib/dashboard/loadDashboard.ts';
export const load = (event) => loadDashboard({ ...event, panelFetch: globalThis.fetch });
