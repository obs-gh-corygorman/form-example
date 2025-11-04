// Next.js instrumentation file - automatically loaded by Next.js
// This file is executed when the Next.js server starts

export async function register() {
  // Only initialize on server-side
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { initOtel } = await import('./src/lib/otel-server');
    initOtel();
  }
}
