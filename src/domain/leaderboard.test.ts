import assert from 'node:assert/strict';
import { test } from 'node:test';
import { rankLeaderboard } from './leaderboard';

test('confirmed support points determine rank', () => {
  const ranked = rankLeaderboard([
    { creatorId: 'b', points: 40, supportCount: 2, firstSupportAt: new Date('2026-01-02'), joinedAt: new Date('2026-01-01') },
    { creatorId: 'a', points: 80, supportCount: 3, firstSupportAt: new Date('2026-01-03'), joinedAt: new Date('2026-01-01') },
  ]);

  assert.equal(ranked[0]?.creatorId, 'a');
  assert.equal(ranked[0]?.rank, 1);
  assert.equal(ranked[1]?.rank, 2);
});

test('equal points use earliest confirmed support then join time', () => {
  const ranked = rankLeaderboard([
    { creatorId: 'late', points: 50, supportCount: 1, firstSupportAt: new Date('2026-01-03'), joinedAt: new Date('2026-01-01') },
    { creatorId: 'early', points: 50, supportCount: 1, firstSupportAt: new Date('2026-01-02'), joinedAt: new Date('2026-01-02') },
  ]);

  assert.equal(ranked[0]?.creatorId, 'early');
});

test('pending support equivalent is zero points and ranks last among zeros by join time', () => {
  const ranked = rankLeaderboard([
    { creatorId: 'none', points: 0, supportCount: 0, firstSupportAt: null, joinedAt: new Date('2026-01-02') },
    { creatorId: 'confirmed', points: 10, supportCount: 1, firstSupportAt: new Date('2026-01-03'), joinedAt: new Date('2026-01-03') },
  ]);

  assert.equal(ranked[0]?.creatorId, 'confirmed');
  assert.equal(ranked[1]?.creatorId, 'none');
});
