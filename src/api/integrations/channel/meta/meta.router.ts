import { RouterBroker } from '@api/abstract/abstract.router';
import { metaController } from '@api/server.module';
import { ConfigService, WaBusiness } from '@config/env.config';
import { Request, Router } from 'express';

import { verifyMetaWebhookSignature } from './meta-webhook-signature';

let loggedMetaWebhookRequests = 0;
let observedSignatureResults = 0;

export class MetaRouter extends RouterBroker {
  constructor(readonly configService: ConfigService) {
    super();
    const signatureMode = process.env.META_WEBHOOK_SIGNATURE_MODE || 'off';
    if (!['off', 'observe', 'enforce'].includes(signatureMode)) {
      throw new Error('META_WEBHOOK_SIGNATURE_MODE must be off, observe, or enforce');
    }
    if (signatureMode === 'enforce' && !process.env.META_WEBHOOK_APP_SECRET?.trim()) {
      throw new Error('META_WEBHOOK_APP_SECRET must be configured before enforcing webhook signatures');
    }

    this.router
      .get(this.routerPath('webhook/meta', false), async (req, res) => {
        if (req.query['hub.verify_token'] === configService.get<WaBusiness>('WA_BUSINESS').TOKEN_WEBHOOK)
          res.send(req.query['hub.challenge']);
        else res.send('Error, wrong validation token');
      })
      .post(this.routerPath('webhook/meta', false), async (req, res) => {
        if (process.env.META_WEBHOOK_LOG_HEADERS === 'true' && loggedMetaWebhookRequests < 5) {
          loggedMetaWebhookRequests += 1;
          console.info('[Meta webhook debug] Incoming POST headers:', req.rawHeaders);
        }

        if (signatureMode === 'observe' || signatureMode === 'enforce') {
          const rawBody = (req as Request & { rawBody?: Buffer }).rawBody;
          const result = verifyMetaWebhookSignature(
            rawBody,
            req.get('x-hub-signature-256'),
            process.env.META_WEBHOOK_APP_SECRET,
          );

          if (signatureMode === 'observe' && observedSignatureResults < 20) {
            observedSignatureResults += 1;
            console.info('[Meta webhook signature] result:', result);
          }

          if (signatureMode === 'enforce' && result !== 'valid') {
            console.warn('[Meta webhook signature] rejected:', result);
            return res.status(403).json({ error: 'Invalid Meta webhook signature' });
          }
        }

        const { body } = req;
        const response = await metaController.receiveWebhook(body);

        return res.status(200).json(response);
      });
  }

  public readonly router: Router = Router();
}
