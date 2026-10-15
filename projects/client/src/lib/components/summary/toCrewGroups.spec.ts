import { describe, expect, it } from 'vitest';
import { toCrewGroups } from './toCrewGroups.ts';

const member = (name: string, jobs: string[], episode_count?: number) => ({
  person: { name, ids: { slug: name.toLowerCase().replace(/ /g, '-') } },
  jobs,
  episode_count,
});

describe('toCrewGroups', () => {
  it('should order departments like OG and drop empty ones', () => {
    const groups = toCrewGroups({
      sound: [member('Dave Porter', ['Original Music Composer'])],
      production: [member('Stewart Lyons', ['Producer'])],
      'created by': [member('Vince Gilligan', ['Creator'])],
      art: [],
    }, false);

    expect(groups.map(({ id, label }) => [id, label])).toEqual([
      ['created-by', 'Created By'],
      ['production', 'Production'],
      ['sound', 'Sound'],
    ]);
  });

  it('should use the jobs as the role and add episode counts only when asked', () => {
    const crew = { production: [member('Michelle MacLaren', ['Executive Producer', 'Director'], 62)] };

    expect(toCrewGroups(crew, true).at(0)?.cast.at(0)).toEqual({
      name: 'Michelle MacLaren',
      href: '/people/michelle-maclaren',
      characters: 'Executive Producer, Director',
      image: undefined,
      episodes: '62 episodes',
    });
    expect(toCrewGroups(crew, false).at(0)?.cast.at(0)?.episodes).toBeUndefined();
  });
});
