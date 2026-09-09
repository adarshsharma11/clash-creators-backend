import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ClashStatus } from '../generated/prisma';
import { canAdminAddParticipant, canCompleteClash, canJoinClash, canSupportClash, isValidClashTransition } from './clash-rules';

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

test('duplicate capacity and draft/live/completed clashes cannot be joined', () => {
  const draft = canJoinClash({
    clashStatus: ClashStatus.DRAFT,
    endsAt: new Date('2026-09-08T12:00:00.000Z'),
    now,
    maxParticipants: 8,
    participantCount: 0,
  });
  assert.equal(draft.ok, false);
  if (!draft.ok) {
    assert.equal(draft.reason, 'This clash is not available for joining');
  }

  const completed = canJoinClash({
    clashStatus: ClashStatus.COMPLETED,
    endsAt: new Date('2026-09-08T12:00:00.000Z'),
    now,
    maxParticipants: 8,
    participantCount: 0,
  });
  assert.equal(completed.ok, false);

  const full = canJoinClash({
    clashStatus: ClashStatus.UPCOMING,
    endsAt: new Date('2026-09-08T12:00:00.000Z'),
    now,
    maxParticipants: 2,
    participantCount: 2,
  });
  assert.equal(full.ok, false);
  if (!full.ok) {
    assert.equal(full.reason, 'This clash is full');
    assert.equal(full.code, 'CLASH_FULL');
  }
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

test('admin can add a creator to a live clash that is not full', () => {
  const live = canAdminAddParticipant({
    clashStatus: ClashStatus.LIVE,
    maxParticipants: 8,
    participantCount: 2,
  });
  assert.equal(live.ok, true);

  const completed = canAdminAddParticipant({
    clashStatus: ClashStatus.COMPLETED,
    maxParticipants: 8,
    participantCount: 2,
  });
  assert.equal(completed.ok, false);
});
