// Next.js instrumentation file - runs on server startup
// This file should be in the root directory (same level as next.config.ts)

export async function register() {
  // Only initialize on server-side
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { initOtel } = await import('./src/lib/otel-server');
    initOtel();
  }
}
