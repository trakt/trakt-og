import { fetchWithUserAgent } from '../../lib/api/withUserAgent.ts';
import { loadDashboard } from '../../lib/dashboard/loadDashboard.ts';
export const load = (event) => loadDashboard({ ...event, panelFetch: fetchWithUserAgent() });
