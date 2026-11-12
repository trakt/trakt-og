import { isHttpError } from '@sveltejs/kit';
import { render } from 'svelte/server';
import type { SeoMeta } from '../seo/SeoMeta.ts';
import SeoTags from '../seo/SeoTags.svelte';
import { SITE_TAGS } from '../seo/siteTags.ts';
import { toSeoTags } from '../seo/toSeoTags.ts';
import { loadPreviewMeta } from './loadPreviewMeta.ts';

type Params = Parameters<typeof loadPreviewMeta>[0] & { url: URL };

async function loadHead(params: Parameters<typeof loadPreviewMeta>[0]): Promise<{ meta: SeoMeta; status: number }> {
  try {
    return { meta: await loadPreviewMeta(params), status: params.routeId ? 200 : 404 };
  } catch (failure) {
    if (isHttpError(failure)) return { meta: {}, status: failure.status };
    throw failure;
  }
}

/**
 * The page a bot that isn't a verified search engine gets (`detectCrawler`'s `headOnly`): the head a member's page
 * would have, its title, description and art, and an empty body. A link preview needs nothing else, and a scraper
 * claiming to be one gets nothing more. A missing title answers with its status and the site's own head.
 */
export async function previewHead({ url, ...params }: Params): Promise<Response> {
  const { meta, status } = await loadHead(params);
  const tags = toSeoTags(meta, { url, routeId: params.routeId, status });
  const { head } = render(SeoTags, { props: { tags, jsonLd: meta.jsonLd } });
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8" />${SITE_TAGS.join('')}${head}</head><body></body></html>`;

  return new Response(html, { status, headers: { 'content-type': 'text/html; charset=utf-8' } });
}
