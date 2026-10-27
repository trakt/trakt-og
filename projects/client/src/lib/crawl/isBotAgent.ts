const SEARCH_ENGINES = [
  'Googlebot',
  'Google-InspectionTool',
  'GoogleOther',
  'Storebot-Google',
  'Bingbot',
  'Slurp',
  'DuckDuckBot',
  'Baiduspider',
  'YandexBot',
  'Sogou',
  'Exabot',
  'ia_archiver',
  'MojeekBot',
  'Applebot',
  'PetalBot',
  'SeznamBot',
  'Qwantify',
  'CocCocBot',
  'Yeti',
];

const LINK_PREVIEWS = [
  'facebot',
  'facebookexternalhit',
  'Twitterbot',
  'LinkedInBot',
  'Slackbot',
  'WhatsApp',
  'Discordbot',
  'pinterest.com/bot',
  'TelegramBot',
  'Viber',
  'SkypeUriPreview',
  'Bluesky',
  'Mastodon',
  'redditbot',
  'Iframely',
  'Embedly',
];

const TOOLS = [
  'Google-Structured-Data-Testing-Tool',
  'Google-PageSpeed-Insights',
  'MJ12bot',
  'AhrefsBot',
  'SemrushBot',
  'DotBot',
  'BLEXBot',
  'UptimeRobot',
  'BublupBot',
];

const BOTS = [...SEARCH_ENGINES, ...LINK_PREVIEWS, ...TOOLS].map((bot) => bot.toLowerCase());

/** A crawler, link-preview fetcher or SEO tool, by its user agent. Anyone can send one, so it is never trusted. */
export function isBotAgent(userAgent: string | null | undefined): boolean {
  const agent = userAgent?.toLowerCase();
  if (!agent) return false;
  return BOTS.some((bot) => agent.includes(bot));
}
