import assert from 'node:assert/strict';
import { test } from 'node:test';
import { joinClashSchema } from './clash';

test('accepts a valid public join payload', () => {
  const parsed = joinClashSchema.parse({
    username: '@learn_with_sam',
    platform: 'INSTAGRAM',
  });
  assert.equal(parsed.username, 'learn_with_sam');
  assert.equal(parsed.platform, 'INSTAGRAM');
});

test('rejects empty username', () => {
  const parsed = joinClashSchema.safeParse({ username: '   ', platform: 'INSTAGRAM' });
  assert.equal(parsed.success, false);
});

test('rejects invalid platform', () => {
  const parsed = joinClashSchema.safeParse({ username: 'learn_with_sam', platform: 'OTHER' });
  assert.equal(parsed.success, false);
  if (!parsed.success) {
    assert.equal(parsed.error.issues[0]?.message, 'Unsupported platform');
  }
});

test('does not accept client-controlled status fields', () => {
  const parsed = joinClashSchema.parse({
    username: 'test_creator_mvp',
    platform: 'INSTAGRAM',
    status: 'CONFIRMED',
    points: 999,
  });
  assert.equal('status' in parsed, false);
  assert.equal('points' in parsed, false);
});
