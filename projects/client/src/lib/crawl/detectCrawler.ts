import { isBotAgent } from './isBotAgent.ts';

type DetectCrawlerParams = {
  userAgent: string | null;
  verifiedBotCategory: string | undefined;
};

/**
 * `verified`: a search engine crawler Cloudflare has verified, which a spoofed user agent can't fake.
 * `bot`: any crawler or link-preview fetcher, verified or known by its user agent.
 */
export function detectCrawler({ userAgent, verifiedBotCategory }: DetectCrawlerParams) {
  const verified = verifiedBotCategory === 'Search Engine Crawler';
  return { verified, bot: verified || verifiedBotCategory === 'Page Preview' || isBotAgent(userAgent) };
}
