// Bun provides this module at runtime; its types are not installed in this project.
// @ts-expect-error -- verified by running this file with `bun test`.
import { describe, expect, it } from 'bun:test';
import { evaluateDcgLeadership } from './dcgLeadership';

describe('DCG portal leadership access', () => {
  it('denies an ordinary member with no leadership DCG', () => {
    expect(evaluateDcgLeadership({ data: null, error: null })).toEqual({
      allowed: false,
      reason: 'not_leader',
    });
  });

  it('allows a member with an assigned Leader or Assistant DCG', () => {
    expect(evaluateDcgLeadership({ data: 'dcg-123', error: null })).toEqual({
      allowed: true,
      dcgId: 'dcg-123',
    });
  });

  it('fails closed when leadership verification fails', () => {
    expect(evaluateDcgLeadership({ data: 'dcg-123', error: new Error('unavailable') })).toEqual({
      allowed: false,
      reason: 'verification_failed',
    });
  });
});
