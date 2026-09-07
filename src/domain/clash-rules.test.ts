import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ClashStatus } from '../generated/prisma';
import { canCompleteClash, canJoinClash, canSupportClash, isValidClashTransition } from './clash-rules';

const now = new Date('2026-09-07T12:00:00.000Z');

test('creator can join an upcoming clash that is not full', () => {
  const result = canJoinClash({
    clashStatus: ClashStatus.UPCOMING,
    endsAt: new Date('2026-09-08T12:00:00.000Z'),
    now,
    maxParticipants: 8,
    participantCount: 2,
  });
  assert.equal(result.ok, true);
});

test('duplicate capacity and draft/live clashes cannot be joined', () => {
  assert.equal(
    canJoinClash({
      clashStatus: ClashStatus.DRAFT,
      endsAt: new Date('2026-09-08T12:00:00.000Z'),
      now,
      maxParticipants: 8,
      participantCount: 0,
    }).ok,
    false
  );
  assert.equal(
    canJoinClash({
      clashStatus: ClashStatus.UPCOMING,
      endsAt: new Date('2026-09-08T12:00:00.000Z'),
      now,
      maxParticipants: 2,
      participantCount: 2,
    }).ok,
    false
  );
});

test('support is accepted only for live clashes in window', () => {
  assert.equal(
    canSupportClash({
      clashStatus: ClashStatus.LIVE,
      startsAt: new Date('2026-09-07T10:00:00.000Z'),
      endsAt: new Date('2026-09-07T14:00:00.000Z'),
      now,
    }).ok,
    true
  );
  assert.equal(
    canSupportClash({
      clashStatus: ClashStatus.COMPLETED,
      startsAt: new Date('2026-09-01T10:00:00.000Z'),
      endsAt: new Date('2026-09-02T10:00:00.000Z'),
      now,
    }).ok,
    false
  );
  assert.equal(
    canSupportClash({
      clashStatus: ClashStatus.DRAFT,
      startsAt: new Date('2026-09-07T10:00:00.000Z'),
      endsAt: new Date('2026-09-07T14:00:00.000Z'),
      now,
    }).ok,
    false
  );
});

test('completed clashes cannot be completed twice via status rules', () => {
  assert.equal(canCompleteClash(ClashStatus.LIVE), true);
  assert.equal(canCompleteClash(ClashStatus.COMPLETED), false);
  assert.equal(isValidClashTransition(ClashStatus.LIVE, ClashStatus.COMPLETED), false);
});
