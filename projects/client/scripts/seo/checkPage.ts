import type { Check } from './Check.ts';
import { checkCanonical } from './checkCanonical.ts';
import { checkXRobotsTag } from './checkXRobotsTag.ts';
import type { HostKind } from './HostKind.ts';
import type { PageResponse } from './PageResponse.ts';
import { parseSeoHtml } from './parseSeoHtml.ts';
import type { SeoHtml } from './SeoHtml.ts';
import { readJsonLd } from './readJsonLd.ts';
import { sameRobots } from './sameRobots.ts';
import { SEO_EXPECTATIONS as EXPECT } from './seoExpectations.ts';
import type { SeoSample } from './SeoSample.ts';

interface CheckPageParams {
  sample: SeoSample;
  response: PageResponse;
  hostKind: HostKind;
}

interface MetaCheck {
  group: string;
  page: SeoHtml;
  key: string;
  /** Why the tag's one value is wrong, or null when it's right. */
  problem?: (value: string) => string | null;
}

const show = (value: string) => `"${value}"`;

const one = ({ group, label, values }: { group: string; label: string; values: readonly string[] }): Check => ({
  group,
  label: `one ${label}`,
  pass: values.length === 1,
  detail: `found ${values.length}`,
});

const meta = ({ group, page, key, problem = (value) => (value ? null : 'empty') }: MetaCheck): Check => {
  const values = page.meta.get(key) ?? [];
  if (values.length !== 1) return { group, label: key, pass: false, detail: `found ${values.length}` };

  const wrong = problem(values.at(0) ?? '');
  return { group, label: key, pass: !wrong, detail: wrong ?? undefined };
};

const expectValue = (expected: string) => (value: string) =>
  value === expected ? null : `got ${show(value)}, want ${show(expected)}`;

const ANY_TITLE = new RegExp(`^.+${EXPECT.titleSuffix}$`);

const wantedTitle = (title: SeoSample['title']) =>
  typeof title === 'string' ? `${title}${EXPECT.titleSuffix}` : (title ?? ANY_TITLE);

const titleChecks = (page: SeoHtml, sample: SeoSample): readonly Check[] => {
  const count = one({ group: 'title', label: '<title>', values: page.titles });
  if (sample.robots === 'noindex' || !count.pass) return [count];

  const title = page.titles.at(0) ?? '';
  const wanted = wantedTitle(sample.title);
  return [
    count,
    {
      group: 'title',
      label: 'title text',
      pass: typeof wanted === 'string' ? title === wanted : wanted.test(title),
      detail: `got ${show(title)}, want ${typeof wanted === 'string' ? show(wanted) : wanted}`,
    },
  ];
};

const imageProblem = (kind: SeoSample['image']) => (url: string) => {
  if (kind === 'default') return url === EXPECT.defaultImage ? null : `got ${show(url)}, want the default share image`;
  if (!url.startsWith('https://')) return `got ${show(url)}, want an absolute https URL`;
  if (url.endsWith('.webp')) return `got ${show(url)}, want .jpg (Facebook and LinkedIn refuse .webp)`;
  if (kind === 'art' && new URL(url).host !== EXPECT.artHost) return `got ${show(url)}, want ${EXPECT.artHost} art`;
  return null;
};

const robotsCheck = (page: SeoHtml, sample: SeoSample): Check => {
  const values = page.meta.get('robots') ?? [];
  const expected = EXPECT.robots[sample.robots];
  if (values.length !== 1)
    return { group: 'robots', label: 'one robots tag', pass: false, detail: `found ${values.length}` };

  const value = values.at(0) ?? '';
  return {
    group: 'robots',
    label: 'robots value',
    pass: sameRobots(value, expected),
    detail: `got ${show(value)}, want ${show(expected)}`,
  };
};

const contentCheck = (page: SeoHtml, sample: SeoSample): Check => {
  if (page.main === null)
    return { group: 'content', label: 'has <main>', pass: false, detail: 'no <main> in the HTML (splash only?)' };
  if (!sample.content)
    return { group: 'content', label: 'has <main>', pass: page.main.length > 0, detail: 'empty <main>' };

  return {
    group: 'content',
    label: `main has "${sample.content}"`,
    pass: page.main.includes(sample.content),
    detail: `"${sample.content}" not in <main>`,
  };
};

const descriptionCheck = (page: SeoHtml) =>
  meta({
    group: 'desc',
    page,
    key: 'description',
    problem: (value) => {
      if (!value.trim()) return 'empty';
      return value.length > EXPECT.descriptionMaxLength
        ? `${value.length} characters, want ${EXPECT.descriptionMaxLength} at most`
        : null;
    },
  });

const openGraphChecks = (page: SeoHtml, sample: SeoSample): readonly Check[] => {
  const group = 'og';
  const ogTypes: readonly string[] = sample.ogType ?? ['website'];
  const defaultImage = sample.image === 'default';
  const sizeCount = (key: string) => (page.meta.get(key) ?? []).length;

  return [
    meta({ group, page, key: 'og:title' }),
    meta({ group, page, key: 'og:description' }),
    meta({ group, page, key: 'og:url', problem: expectValue(`${EXPECT.origin}${sample.canonical ?? ''}`) }),
    meta({
      group,
      page,
      key: 'og:type',
      problem: (value) => (ogTypes.includes(value) ? null : `got ${show(value)}, want ${ogTypes.join(' or ')}`),
    }),
    meta({ group, page, key: 'og:site_name', problem: expectValue(EXPECT.siteName) }),
    meta({ group, page, key: 'og:locale', problem: expectValue(EXPECT.locale) }),
    meta({ group, page, key: 'og:image', problem: imageProblem(sample.image) }),
    meta({ group, page, key: 'og:image:alt' }),
    {
      group,
      label: 'og:image size',
      pass: defaultImage
        ? sizeCount('og:image:width') === 1 && sizeCount('og:image:height') === 1
        : sizeCount('og:image:width') + sizeCount('og:image:height') === 0,
      detail: defaultImage
        ? 'the default image needs og:image:width and og:image:height'
        : 'only the default image sets a size',
    },
  ];
};

const twitterChecks = (page: SeoHtml): readonly Check[] => [
  meta({ group: 'twitter', page, key: 'twitter:card', problem: expectValue(EXPECT.twitterCard) }),
  meta({ group: 'twitter', page, key: 'twitter:site', problem: expectValue(EXPECT.twitterSite) }),
];

const jsonLdChecks = (page: SeoHtml, sample: SeoSample): readonly Check[] => {
  const { types, errors, nulls } = readJsonLd(page.jsonLd);
  const expected = [...EXPECT.jsonLd, ...(sample.jsonLd ?? [])];

  return [
    { group: 'ld', label: 'JSON-LD parses', pass: errors.length === 0, detail: errors.join('; ') },
    { group: 'ld', label: 'no null fields', pass: nulls.length === 0, detail: nulls.slice(0, 3).join(', ') },
    ...expected.map((type) => ({
      group: 'ld',
      label: `has ${type}`,
      pass: types.includes(type),
      detail: `types: ${types.join(', ') || 'none'}`,
    })),
  ];
};

/** Everything one fetch of a sample page must get right. */
export function checkPage({ sample, response, hostKind }: CheckPageParams): readonly Check[] {
  const location = response.headers.get('location');
  const status: Check = {
    group: 'status',
    label: 'answers 200',
    pass: response.status === 200,
    detail: `got ${response.status}${location ? ` to ${location}` : ''}`,
  };
  const xRobots = checkXRobotsTag(response.headers, hostKind);
  if (!status.pass) return [status, xRobots];

  const page = parseSeoHtml(response.body);
  const always = [status, ...titleChecks(page, sample), robotsCheck(page, sample), contentCheck(page, sample), xRobots];
  if (sample.robots === 'noindex') return always;

  return [
    ...always,
    descriptionCheck(page),
    checkCanonical(page, sample.canonical ?? sample.path),
    ...openGraphChecks(page, sample),
    ...twitterChecks(page),
    ...jsonLdChecks(page, sample),
  ];
}
