import 'dotenv/config';

console.log('[boot] server entry loaded', {
  entry: 'backend/server.ts',
  nodeEnv: process.env.NODE_ENV || 'development',
  port: process.env.PORT || '10000',
});

console.log('[boot] env check starting', {
  hasJwtAccessSecret: Boolean(process.env.JWT_ACCESS_SECRET),
  hasJwtRefreshSecret: Boolean(process.env.JWT_REFRESH_SECRET),
  hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
  hasDirectUrl: Boolean(process.env.DIRECT_URL),
  usePrismaRuntime: process.env.USE_PRISMA_RUNTIME || 'unset',
});

process.on('uncaughtException', (error) => {
  console.error('[boot] uncaughtException', error);
});

process.on('unhandledRejection', (reason) => {
  console.error('[boot] unhandledRejection', reason);
});

try {
  const serverModule = await import('./server.app');
  console.log('[boot] imports loaded');

  if (typeof serverModule.startServer !== 'function') {
    throw new Error('backend/server.app.ts does not export startServer');
  }

  await serverModule.startServer();
} catch (error) {
  console.error('[boot] startup failed', error);
  process.exit(1);
}
