import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import test from 'node:test';

const source = readFileSync(new URL('../src/api/integrations/channel/meta/meta-webhook-signature.ts', import.meta.url), 'utf8');
const javascript = stripTypeScriptTypes(source, { mode: 'strip' });
const moduleUrl = `data:text/javascript;base64,${Buffer.from(javascript).toString('base64')}`;
const { verifyMetaWebhookSignature } = await import(moduleUrl);

const body = Buffer.from('{"entry":[{"changes":[{"value":{"messages":[]}}]}]}');
const secret = 'local-test-app-secret';
const signature = `sha256=${createHmac('sha256', secret).update(body).digest('hex')}`;

test('accepts the exact signed request body', () => {
  assert.equal(verifyMetaWebhookSignature(body, signature, secret), 'valid');
});

test('rejects modified, unsigned, and malformed requests', () => {
  assert.equal(verifyMetaWebhookSignature(Buffer.from('{}'), signature, secret), 'invalid_signature');
  assert.equal(verifyMetaWebhookSignature(body, undefined, secret), 'missing_signature');
  assert.equal(verifyMetaWebhookSignature(body, 'sha256=bad', secret), 'invalid_signature');
  assert.equal(verifyMetaWebhookSignature(body, signature, 'wrong-secret'), 'invalid_signature');
});

test('reports missing configuration or original body', () => {
  assert.equal(verifyMetaWebhookSignature(body, signature, undefined), 'missing_app_secret');
  assert.equal(verifyMetaWebhookSignature(undefined, signature, secret), 'missing_raw_body');
});
