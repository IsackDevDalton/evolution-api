import { authGuard } from '@api/guards/auth.guard';
import { instanceExistsGuard, instanceLoggedGuard } from '@api/guards/instance.guard';
import Telemetry from '@api/guards/telemetry.guard';
import { ChannelRouter } from '@api/integrations/channel/channel.router';
import { ChatbotRouter } from '@api/integrations/chatbot/chatbot.router';
import { EventRouter } from '@api/integrations/event/event.router';
import { StorageRouter } from '@api/integrations/storage/storage.router';
import { configService, Facebook } from '@config/env.config';
import { Router } from 'express';
import fs from 'fs';
import mimeTypes from 'mime-types';
import path from 'path';

import { BusinessRouter } from './business.router';
import { CallRouter } from './call.router';
import { ChatRouter } from './chat.router';
import { GroupRouter } from './group.router';
import { InstanceRouter } from './instance.router';
import { LabelRouter } from './label.router';
import { ProxyRouter } from './proxy.router';
import { MessageRouter } from './sendMessage.router';
import { SettingsRouter } from './settings.router';
import { TemplateRouter } from './template.router';
import { ViewsRouter } from './view.router';

enum HttpStatus {
  OK = 200,
  CREATED = 201,
  NOT_FOUND = 404,
  FORBIDDEN = 403,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  INTERNAL_SERVER_ERROR = 500,
}

const router: Router = Router();
const serverConfig = configService.get('SERVER');

const guards = [instanceExistsGuard, instanceLoggedGuard, authGuard['apikey']];

const telemetry = new Telemetry();

if (!serverConfig.DISABLE_MANAGER) router.use('/manager', new ViewsRouter().router);
if (!serverConfig.DISABLE_MANAGER) {
  router.post('/verify-creds', authGuard['apikey'], async (req, res) => {
    const facebookConfig = configService.get<Facebook>('FACEBOOK');
    return res.status(HttpStatus.OK).json({
      status: HttpStatus.OK,
      message: 'Credentials are valid',
      facebookAppId: facebookConfig.APP_ID,
      facebookConfigId: facebookConfig.CONFIG_ID,
      facebookUserToken: facebookConfig.USER_TOKEN,
    });
  });
} else {
  router.use(['/manager', '/assets', '/verify-creds', '/instance/fetchInstances'], (_req, res) => {
    return res.status(HttpStatus.NOT_FOUND).end();
  });
}

if (!serverConfig.DISABLE_MANAGER) router.get('/assets/*', (req, res) => {
  const fileName = req.params[0];

  // Security: Reject paths containing traversal patterns
  if (!fileName || fileName.includes('..') || fileName.includes('\\') || path.isAbsolute(fileName)) {
    return res.status(403).send('Forbidden');
  }

  const basePath = path.join(process.cwd(), 'manager', 'dist');
  const assetsPath = path.join(basePath, 'assets');
  const filePath = path.join(assetsPath, fileName);

  // Security: Ensure the resolved path is within the assets directory
  const resolvedPath = path.resolve(filePath);
  const resolvedAssetsPath = path.resolve(assetsPath);

  if (!resolvedPath.startsWith(resolvedAssetsPath + path.sep) && resolvedPath !== resolvedAssetsPath) {
    return res.status(403).send('Forbidden');
  }

  if (fs.existsSync(resolvedPath)) {
    res.set('Content-Type', mimeTypes.lookup(resolvedPath) || 'text/css');
    res.send(fs.readFileSync(resolvedPath));
  } else {
    res.status(404).send('File not found');
  }
});

router
  .use((req, res, next) => telemetry.collectTelemetry(req, res, next))

  .get('/', (_req, res) => {
    if (serverConfig.DISABLE_MANAGER) return res.status(HttpStatus.NOT_FOUND).end();
    return res.redirect(302, '/manager/');
  })
  .use('/instance', new InstanceRouter(configService, ...guards).router)
  .use('/message', new MessageRouter(...guards).router)
  .use('/call', new CallRouter(...guards).router)
  .use('/chat', new ChatRouter(...guards).router)
  .use('/business', new BusinessRouter(...guards).router)
  .use('/group', new GroupRouter(...guards).router)
  .use('/template', new TemplateRouter(configService, ...guards).router)
  .use('/settings', new SettingsRouter(...guards).router)
  .use('/proxy', new ProxyRouter(...guards).router)
  .use('/label', new LabelRouter(...guards).router)
  .use('', new ChannelRouter(configService, ...guards).router)
  .use('', new EventRouter(configService, ...guards).router)
  .use('', new ChatbotRouter(...guards).router)
  .use('', new StorageRouter(...guards).router);

export { HttpStatus, router };
