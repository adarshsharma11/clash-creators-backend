import assert from 'node:assert/strict';
import { test } from 'node:test';
import { isJoinPlatform, normalizeJoinUsername, socialProfileUrl } from './join-identity';

test('normalizes @username and surrounding whitespace without lowercasing', () => {
  assert.equal(normalizeJoinUsername('  @learn_with_sam  '), 'learn_with_sam');
  assert.equal(normalizeJoinUsername('@@NovaPlays'), 'NovaPlays');
  assert.equal(normalizeJoinUsername(' LEARN_WITH_SAM '), 'LEARN_WITH_SAM');
});

test('empty or at-only values collapse to empty', () => {
  assert.equal(normalizeJoinUsername(''), '');
  assert.equal(normalizeJoinUsername('   '), '');
  assert.equal(normalizeJoinUsername('@'), '');
});

test('only supported join platforms are accepted', () => {
  assert.equal(isJoinPlatform('INSTAGRAM'), true);
  assert.equal(isJoinPlatform('YOUTUBE'), true);
  assert.equal(isJoinPlatform('TIKTOK'), true);
  assert.equal(isJoinPlatform('X'), true);
  assert.equal(isJoinPlatform('FACEBOOK'), true);
  assert.equal(isJoinPlatform('TWITCH'), true);
  assert.equal(isJoinPlatform('OTHER'), false);
  assert.equal(isJoinPlatform('instagram'), false);
});

test('builds a safe profile URL from platform and username', () => {
  assert.equal(socialProfileUrl('INSTAGRAM', 'learn_with_sam'), 'https://instagram.com/learn_with_sam');
  assert.equal(socialProfileUrl('YOUTUBE', 'NovaPlays'), 'https://youtube.com/@NovaPlays');
});
