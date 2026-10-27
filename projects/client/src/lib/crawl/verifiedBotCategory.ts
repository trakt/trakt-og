/**
 * Cloudflare's category for a bot it has verified (by IP and reverse DNS), like "Search Engine Crawler" or
 * "Page Preview". Unset for everyone else and in local dev. Workers' types leave the field out.
 *
 * @see https://developers.cloudflare.com/bots/concepts/bot/verified-bots/categories/
 */
export function verifiedBotCategory(request: Request): string | undefined {
  const cf: { verifiedBotCategory?: unknown } | undefined = Reflect.get(request, 'cf');
  return typeof cf?.verifiedBotCategory === 'string' ? cf.verifiedBotCategory : undefined;
}
