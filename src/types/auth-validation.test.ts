import assert from 'node:assert/strict';
import { test } from 'node:test';
import { loginSchema, signupSchema } from './zod';
import { paginationSchema } from './common';

test('signup rejects weak passwords and duplicate-shape fields', () => {
  const weak = signupSchema.safeParse({
    fullName: 'Test User',
    username: 'tester',
    email: 'test@example.com',
    password: 'short',
  });
  assert.equal(weak.success, false);

  const lettersOnly = signupSchema.safeParse({
    fullName: 'Test User',
    username: 'tester',
    email: 'test@example.com',
    password: 'passwordonly',
  });
  assert.equal(lettersOnly.success, false);
});

test('signup normalizes email and username', () => {
  const parsed = signupSchema.parse({
    fullName: 'Test User',
    username: 'Test_User',
    email: '  Test@Example.COM ',
    password: 'DevPassword123',
  });
  assert.equal(parsed.username, 'test_user');
  assert.equal(parsed.email, 'test@example.com');
});

test('login normalizes identifier', () => {
  const parsed = loginSchema.parse({ username: '  Nova_Gamer ', password: 'secret' });
  assert.equal(parsed.username, 'nova_gamer');
});

test('pagination rejects huge limits', () => {
  const tooBig = paginationSchema.safeParse({ page: 1, limit: 500 });
  assert.equal(tooBig.success, false);
  const ok = paginationSchema.parse({ page: 1, limit: 100 });
  assert.equal(ok.limit, 100);
});
