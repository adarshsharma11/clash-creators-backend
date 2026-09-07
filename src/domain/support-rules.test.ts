import assert from 'node:assert/strict';
import { test } from 'node:test';
import { isValidSupportPoints } from './support-rules';
import { createSupportSchema } from '../types/support';
import { createReportSchema } from '../types/report';

test('valid support points pass', () => {
  assert.equal(isValidSupportPoints(25, 1, 1000).ok, true);
});

test('invalid support points are rejected', () => {
  assert.equal(isValidSupportPoints(0, 1, 1000).ok, false);
  assert.equal(isValidSupportPoints(-5, 1, 1000).ok, false);
  assert.equal(isValidSupportPoints(1.5, 1, 1000).ok, false);
  assert.equal(isValidSupportPoints(2000, 1, 1000).ok, false);
});

test('createSupportSchema rejects client-provided confirmation fields', () => {
  const parsed = createSupportSchema.safeParse({
    clashId: 'clash_1',
    creatorId: 'creator_1',
    points: 10,
    status: 'CONFIRMED',
  });
  assert.equal(parsed.success, true);
  if (parsed.success) {
    assert.equal('status' in parsed.data, false);
  }
});

test('report requires a creator or clash target', () => {
  const invalid = createReportSchema.safeParse({
    reason: 'SPAM',
    description: 'hello',
  });
  assert.equal(invalid.success, false);

  const valid = createReportSchema.safeParse({
    creatorId: 'creator_1',
    reason: 'SPAM',
  });
  assert.equal(valid.success, true);
});
