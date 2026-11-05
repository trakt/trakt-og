import { SITE_ORIGIN } from '#lib/seo/siteOrigin.ts';

type ReportingEnvironment = {
  origin: string;
  dev: boolean;
};

// Stricter than trakt-web, which reports from any non-dev build. Local
// production builds and previews run under other origins and only log.
export function isReportingEnabled({ origin, dev }: ReportingEnvironment): boolean {
  return !dev && origin === SITE_ORIGIN;
}
