import { isBotAgent } from './isBotAgent.ts';

type DetectCrawlerParams = {
  userAgent: string | null;
  verifiedBotCategory: string | undefined;
};

/**
 * `verified`: a search engine crawler Cloudflare has verified, which a spoofed user agent can't fake.
 * `bot`: any crawler or link-preview fetcher, verified or known by its user agent.
 * `headOnly`: a bot that isn't a verified search engine. It gets the page's head alone (`previewHead.ts`), since a
 * user agent is easy to fake and a link preview needs nothing else.
 */
export function detectCrawler({ userAgent, verifiedBotCategory }: DetectCrawlerParams) {
  const verified = verifiedBotCategory === 'Search Engine Crawler';
  const bot = verified || verifiedBotCategory === 'Page Preview' || isBotAgent(userAgent);
  return { verified, bot, headOnly: bot && !verified };
}
