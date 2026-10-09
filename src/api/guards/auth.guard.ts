import { InstanceDto } from '@api/dto/instance.dto';
import { prismaRepository } from '@api/server.module';
import { Auth, configService, Database } from '@config/env.config';
import { Logger } from '@config/logger.config';
import { UnauthorizedException } from '@exceptions';
import { NextFunction, Request, Response } from 'express';

const logger = new Logger('GUARD');
const failureWindowMs = 5 * 60 * 1000;
const maxFailures = 5;
const failures = new Map<string, { count: number; resetAt: number }>();

async function apikey(req: Request, res: Response, next: NextFunction) {
  const path = req.originalUrl.split('?')[0];
  const isLoginAttempt = path === '/verify-creds' || path === '/instance/fetchInstances';
  const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const current = isLoginAttempt ? failures.get(clientIp) : undefined;
  if (isLoginAttempt && current && current.resetAt > now && current.count >= maxFailures) {
    res.set('Retry-After', String(Math.ceil((current.resetAt - now) / 1000)));
    return res.status(429).json({ error: 'Too many authentication attempts' });
  }
  if (isLoginAttempt && current && current.resetAt <= now) failures.delete(clientIp);
  const reject = () => {
    if (!isLoginAttempt) throw new UnauthorizedException();
    if (failures.size >= 10000) {
      for (const [ip, attempt] of failures) {
        if (attempt.resetAt <= now) failures.delete(ip);
      }
      const oldest = failures.keys().next().value;
      if (failures.size >= 10000 && oldest) failures.delete(oldest);
    }
    const previous = failures.get(clientIp);
    failures.set(clientIp, { count: (previous?.count || 0) + 1, resetAt: previous?.resetAt || now + failureWindowMs });
    throw new UnauthorizedException();
  };
  const env = configService.get<Auth>('AUTHENTICATION').API_KEY;
  const key = req.get('apikey');
  const db = configService.get<Database>('DATABASE');

  if (!key) {
    reject();
  }

  if (env.KEY === key) {
    if (isLoginAttempt) failures.delete(clientIp);
    return next();
  }

  const param = req.params as unknown as InstanceDto;

  try {
    if (param?.instanceName) {
      const instance = await prismaRepository.instance.findUnique({
        where: { name: param.instanceName },
      });
      if (instance?.token === key) {
        if (isLoginAttempt) failures.delete(clientIp);
        return next();
      }
    } else {
      if (req.originalUrl.includes('/instance/fetchInstances') && db.SAVE_DATA.INSTANCE) {
        const instanceByKey = await prismaRepository.instance.findFirst({
          where: { token: key },
        });
        if (instanceByKey) {
          if (isLoginAttempt) failures.delete(clientIp);
          return next();
        }
      }
    }
  } catch (error) {
    logger.error(error);
  }

  reject();
}

export const authGuard = { apikey };
