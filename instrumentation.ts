// instrumentation.ts - Next.js instrumentation hook
// This file is automatically loaded by Next.js when experimental.instrumentationHook is enabled

export async function register() {
  // Only run instrumentation on the server side
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Import and initialize OpenTelemetry
    await import('./otel');
  }
}