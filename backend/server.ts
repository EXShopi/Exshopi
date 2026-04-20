import 'dotenv/config';

console.log('BOOT STARTED');
console.log('ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);

process.on('uncaughtException', (error) => {
  console.error('UNCAUGHT EXCEPTION:', error);
});

process.on('unhandledRejection', (reason) => {
  console.error('UNHANDLED REJECTION:', reason);
});

try {
  const serverModule = await import('./server.app');
  console.log('IMPORTS LOADED');

  if (typeof serverModule.startServer !== 'function') {
    throw new Error('backend/server.app.ts does not export startServer');
  }

  await serverModule.startServer();
} catch (error) {
  console.error('INIT FAILED', error);
  process.exit(1);
}
