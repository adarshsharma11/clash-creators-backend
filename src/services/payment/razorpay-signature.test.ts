import assert from 'node:assert/strict';
import { test } from 'node:test';
import { paiseFromPoints, verifyCheckoutSignature, verifyWebhookSignature } from './razorpay-signature';

const secret = 'test_razorpay_secret';

test('valid checkout signatures are accepted', () => {
  const expected = require('crypto')
    .createHmac('sha256', secret)
    .update('order_1|pay_1')
    .digest('hex');
  assert.equal(verifyCheckoutSignature('order_1', 'pay_1', expected, secret), true);
});

test('invalid checkout signatures are rejected', () => {
  assert.equal(verifyCheckoutSignature('order_1', 'pay_1', 'deadbeef', secret), false);
  assert.equal(verifyCheckoutSignature('order_1', 'pay_1', '', secret), false);
  assert.equal(verifyCheckoutSignature('order_1', 'pay_1', 'abc', ''), false);
});

test('webhook signatures verify the raw body', () => {
  const body = '{"event":"payment.captured"}';
  const expected = require('crypto').createHmac('sha256', secret).update(body).digest('hex');
  assert.equal(verifyWebhookSignature(body, expected, secret), true);
  assert.equal(verifyWebhookSignature(body, 'nope', secret), false);
});

test('points convert to paise without trusting client amounts', () => {
  assert.equal(paiseFromPoints(25), 2500);
  assert.equal(paiseFromPoints(1), 100);
});
