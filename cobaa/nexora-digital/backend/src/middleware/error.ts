import { Request, Response, NextFunction } from 'express';
import { ZodError, ZodSchema } from 'zod';
import { logger, config } from '../config';

export class AppError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function validate(schema: ZodSchema, source: 'body' | 'query' | 'params' = 'body') {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      next(new AppError(400, 'VALIDATION_ERROR', result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')));
      return;
    }
    if (source === 'body') req.body = result.data;
    next();
  };
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    res.status(err.status).json({ error: { code: err.code, message: err.message } });
    return;
  }
  if (err instanceof ZodError) {
    res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: err.issues.map((i) => i.message).join('; ') } });
    return;
  }
  logger.error({ err }, 'Unhandled error');
  if (config.nodeEnv !== 'production') {
    console.error('[DEV-ERROR]', err instanceof Error ? err.stack : err);
    res.status(500).json({ error: { code: 'INTERNAL', message: 'Terjadi kesalahan internal.', devDetail: err instanceof Error ? err.message : String(err) } });
    return;
  }
  res.status(500).json({ error: { code: 'INTERNAL', message: 'Terjadi kesalahan internal.' } });
}
