/** A robots.txt file's groups and sitemaps. */
export interface RobotsTxt {
  groups: readonly RobotsGroup[];
  sitemaps: readonly string[];
}

interface RobotsGroup {
  /** Lowercased user-agent tokens. */
  agents: readonly string[];
  rules: readonly RobotsRule[];
}

interface RobotsRule {
  allow: boolean;
  path: string;
}
