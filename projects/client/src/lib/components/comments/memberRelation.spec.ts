import { describe, expect, it } from 'vitest';
import { memberRelation } from './memberRelation.ts';

const network = { following: new Set(['dorond', 'ralffff']), followers: new Set(['ralffff', 'mixo0']) };

describe('util: memberRelation', () => {
  it('should call someone who follows back a friend', () => {
    expect(memberRelation(network, 'ralffff')).toBe('friend');
  });

  it('should call a one-way follow following', () => {
    expect(memberRelation(network, 'dorond')).toBe('following');
  });

  it('should say nothing for a follower the viewer does not follow', () => {
    expect(memberRelation(network, 'mixo0')).toBeUndefined();
  });

  it('should say nothing for deleted members or before the network loads', () => {
    expect(memberRelation(network, undefined)).toBeUndefined();
    expect(memberRelation(undefined, 'ralffff')).toBeUndefined();
  });
});
