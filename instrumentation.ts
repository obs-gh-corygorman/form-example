export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Server-side instrumentation
    const { initOtel } = await import('./src/lib/otel-server');
    initOtel();
  }
}
