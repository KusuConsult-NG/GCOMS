import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/all-exceptions.filter';

/**
 * Parses ALLOWED_ORIGINS ("https://a.org,https://b.org"). The previous CORS
 * config reflected whatever Origin the caller sent and paired it with
 * credentials: true, which is the same as having no origin policy at all.
 */
function parseAllowedOrigins(raw: string | undefined): string[] {
  return (raw ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const logger = new Logger('Bootstrap');
  const config = app.get(ConfigService);

  const isProduction = config.get<string>('NODE_ENV') === 'production';
  const allowedOrigins = parseAllowedOrigins(
    config.get<string>('ALLOWED_ORIGINS'),
  );

  if (allowedOrigins.length === 0) {
    if (isProduction) {
      throw new Error(
        'ALLOWED_ORIGINS is empty. Set the origins permitted to call this API.',
      );
    }
    logger.warn(
      'ALLOWED_ORIGINS is empty — all cross-origin browser requests will be refused. ' +
        'This aborts startup when NODE_ENV=production.',
    );
  }

  app.use(
    helmet({
      // This API is read from the web app's origin, so the default
      // same-origin CORP would have browsers block every response. CORS above is
      // what actually decides who may call it.
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      // CSP governs what a *document* may load. This service only ever returns
      // JSON, so the default policy adds bytes and a false sense of coverage —
      // the app that needs a CSP is the Next.js frontend, which has none.
      contentSecurityPolicy: false,
    }),
  );

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      // Same-origin and non-browser callers (curl, server-to-server) send no
      // Origin header; there is nothing to police in that case.
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter());

  // Without this, in-flight requests are dropped on every deploy and Prisma
  // never disconnects.
  app.enableShutdownHooks();

  const port = config.get<string>('PORT') ?? 3001;
  await app.listen(port);
  logger.log(`GCOMS API listening on port ${port}`);
  logger.log(
    allowedOrigins.length
      ? `CORS origins: ${allowedOrigins.join(', ')}`
      : 'CORS: no cross-origin callers permitted',
  );
}

void bootstrap();
