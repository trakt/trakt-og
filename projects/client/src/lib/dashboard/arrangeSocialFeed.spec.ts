import { describe, expect, it } from 'vitest';
import { arrangeSocialFeed, type SocialFeedLayout } from './arrangeSocialFeed.ts';
import { groupSittings } from './groupSittings.ts';
import { socialFeedFixture } from './socialFeedFixture.ts';
import { toSocialItem } from './toSocialItem.ts';
import { toSocialSitting } from './toSocialSitting.ts';

const now = new Date('2026-10-05T16:30:00Z');
const datePreferences = { order: 'mdy', hour24: false, timeZone: 'UTC', weekStartDay: 0 } as const;
const sittings = groupSittings(socialFeedFixture.rows(now).map((row) => toSocialItem(row, datePreferences)))
  .map((sitting) => toSocialSitting({ sitting, now, datePreferences }));
const live = socialFeedFixture.live(now);
const arrange = (watching: number, at = now) => arrangeSocialFeed({ sittings, live: live.slice(0, watching), now: at });

const tileNames = ({ tiles }: SocialFeedLayout) =>
  tiles.map((tile) => (tile.kind === 'live' ? `live:${tile.watch.member.name}` : tile.sitting.member.name));
const timelineNames = ({ timeline }: SocialFeedLayout) => timeline.map(({ member }) => member.name);

describe('arrangeSocialFeed', () => {
  it("should fill four tiles with each member's latest sitting when nobody is watching", () => {
    const layout = arrange(0);

    expect(tileNames(layout)).toEqual(['Kristin', 'Sefer', 'Damien', 'MajorMercyFlush']);
    expect(timelineNames(layout)).toEqual(['Kristin', 'Damien', 'Technicolour', 'Kristin', 'Sefer', 'Justin', 'Rook']);
    expect(layout.overflow).toEqual([]);
  });

  it("should show only a sitting's lead title on its tile and keep the rest in the timeline, by when it ended", () => {
    const layout = arrange(0);
    const damien = layout.tiles.find((tile) => tile.kind === 'sitting' && tile.sitting.member.name === 'Damien');
    const rest = layout.timeline.find(({ member }) => member.name === 'Damien');

    expect(damien?.kind === 'sitting' && damien.sitting.summary.tile.link).toEqual({
      text: 'Lioness 3x02',
      href: '/shows/lioness/seasons/3/episodes/2',
    });
    expect(rest?.summary.head.links.map(({ text }) => text)).toEqual(['Lanterns 1x08']);
    expect(layout.timeline.map(({ newest }) => newest)).toEqual(
      layout.timeline.map(({ newest }) => newest).toSorted().toReversed(),
    );
  });

  it('should lead with who is watching and keep their sittings in the timeline', () => {
    const layout = arrange(1);
    const [first] = layout.tiles;

    expect(tileNames(layout)).toEqual(['live:Kristin', 'Sefer', 'Damien', 'MajorMercyFlush']);
    expect(timelineNames(layout)).toEqual(['Kristin', 'Damien', 'Technicolour', 'Kristin', 'Sefer', 'Justin', 'Rook']);
    expect(layout.timeline.at(0)).toBe(sittings.at(0));
    expect(first).toMatchObject({ kind: 'live', progress: 85, minutesLeft: 4 });
  });

  it('should put the newest start first', () => {
    expect(tileNames(arrange(3))).toEqual(['live:Damien', 'live:Kristin', 'live:Sefer', 'MajorMercyFlush']);
  });

  it('should keep four tiles with five or more watching, the rest behind the last', () => {
    const layout = arrange(7);

    expect(tileNames(layout)).toEqual(['live:Noor', 'live:Damien', 'live:MajorMercyFlush']);
    expect(layout.overflow.map(({ watch }) => watch.member.name)).toEqual(['Kristin', 'Rook', 'Sefer', 'Ana']);
    expect([...layout.watchingNow]).toEqual(['sample-kristin', 'sample-rook', 'sample-sefer', 'sample-ana']);
    expect(timelineNames(layout)).toEqual([
      'Kristin',
      'Sefer',
      'Damien',
      'MajorMercyFlush',
      'Technicolour',
      'Kristin',
      'Sefer',
      'Justin',
      'Rook',
    ]);
  });

  it('should drop a watch once it expires', () => {
    const later = new Date(now.getTime() + 5 * 60_000);

    expect(tileNames(arrange(1, later))).toEqual(['Kristin', 'Sefer', 'Damien', 'MajorMercyFlush']);
  });
});
