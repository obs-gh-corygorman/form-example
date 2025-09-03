// Next.js instrumentation file - runs on server startup
// This file is automatically loaded by Next.js when the server starts

export async function register() {
  // Only initialize OpenTelemetry on the server side
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { initOtel } = await import('./src/lib/otel-server');
    initOtel();
  }
}
