import { describe, expect, it } from 'vitest';
import { toSummaryDraft } from './toSummaryDraft.ts';

const reply = (value: unknown) => JSON.stringify(value);
const good = {
  title: 'The One With the Calendar',
  themes: [{ section: 'Calendar', text: 'The calendar shows premieres and finales for the shows you follow.' }],
};

describe('util: toSummaryDraft', () => {
  it('should accept a valid summary', () => {
    expect(toSummaryDraft({ content: reply(good), names: ['alice'] })).toEqual({ ok: true, draft: good });
  });

  it('should accept a summary wrapped in a code fence', () => {
    expect(toSummaryDraft({ content: `\`\`\`json\n${reply(good)}\n\`\`\``, names: [] }).ok).toBe(true);
  });

  it('should reject a reply that is not JSON', () => {
    expect(toSummaryDraft({ content: 'Here is your summary!', names: [] }).ok).toBe(false);
  });

  it('should reject a long title, too many themes or an unknown section', () => {
    const theme = good.themes[0];
    expect(toSummaryDraft({ content: reply({ ...good, title: 'x'.repeat(61) }), names: [] }).ok).toBe(false);
    expect(toSummaryDraft({ content: reply({ ...good, themes: Array(8).fill(theme) }), names: [] }).ok).toBe(false);
    expect(toSummaryDraft({ content: reply({ ...good, themes: [] }), names: [] }).ok).toBe(false);
    expect(
      toSummaryDraft({ content: reply({ ...good, themes: [{ section: 'Backend', text: 'x' }] }), names: [] }).ok,
    ).toBe(false);
  });

  it('should reject developer words in the title or a theme', () => {
    const title = { ...good, title: 'The One With the Refactor' };
    const theme = { ...good, themes: [{ section: 'Lists', text: 'Lists use a new component.' }] };
    expect(toSummaryDraft({ content: reply(title), names: [] })).toEqual({
      ok: false,
      reason: 'the summary uses developer words',
    });
    expect(toSummaryDraft({ content: reply(theme), names: [] }).ok).toBe(false);
  });

  it('should reject a summary that names an author', () => {
    const named = { ...good, themes: [{ section: 'Lists', text: 'Thanks to Alice, lists sort by rating.' }] };
    expect(toSummaryDraft({ content: reply(named), names: ['alice'] })).toEqual({
      ok: false,
      reason: 'the summary names a person',
    });
  });
});
