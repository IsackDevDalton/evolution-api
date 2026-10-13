import { createHmac, timingSafeEqual } from 'node:crypto';

export type MetaWebhookSignatureResult =
  | 'valid'
  | 'missing_app_secret'
  | 'missing_raw_body'
  | 'missing_signature'
  | 'invalid_signature';

export function verifyMetaWebhookSignature(
  rawBody: Buffer | undefined,
  signature: string | undefined,
  appSecret: string | undefined,
): MetaWebhookSignatureResult {
  if (!appSecret) return 'missing_app_secret';
  if (!rawBody) return 'missing_raw_body';
  if (!signature) return 'missing_signature';
  if (!/^sha256=[a-f0-9]{64}$/i.test(signature)) return 'invalid_signature';

  const expected = createHmac('sha256', appSecret).update(rawBody).digest();
  const received = Buffer.from(signature.slice(7), 'hex');
  return timingSafeEqual(expected, received) ? 'valid' : 'invalid_signature';
}
