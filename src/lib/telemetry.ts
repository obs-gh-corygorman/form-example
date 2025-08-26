import { trace, context, SpanStatusCode, Span } from '@opentelemetry/api';

// Get the tracer instance
export const tracer = trace.getTracer('nextjs-form-example', '1.0.0');

/**
 * Wraps an async function with OpenTelemetry instrumentation
 * Creates a span with the given name and optional attributes
 */
export async function instrumentedFunction<T>(
  name: string,
  fn: () => Promise<T>,
  attributes?: Record<string, string | number | boolean>
): Promise<T> {
  return tracer.startActiveSpan(name, { attributes }, async (span: Span) => {
    try {
      const result = await fn();
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus({ 
        code: SpanStatusCode.ERROR, 
        message: (error as Error).message 
      });
      throw error;
    } finally {
      span.end();
    }
  });
}

/**
 * Wraps a synchronous function with OpenTelemetry instrumentation
 */
export function instrumentedSyncFunction<T>(
  name: string,
  fn: () => T,
  attributes?: Record<string, string | number | boolean>
): T {
  return tracer.startActiveSpan(name, { attributes }, (span: Span) => {
    try {
      const result = fn();
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus({ 
        code: SpanStatusCode.ERROR, 
        message: (error as Error).message 
      });
      throw error;
    } finally {
      span.end();
    }
  });
}

/**
 * Adds custom attributes to the current active span
 */
export function addSpanAttributes(attributes: Record<string, string | number | boolean>): void {
  const span = trace.getActiveSpan();
  if (span) {
    span.setAttributes(attributes);
  }
}

/**
 * Records an exception in the current active span
 */
export function recordException(error: Error): void {
  const span = trace.getActiveSpan();
  if (span) {
    span.recordException(error);
    span.setStatus({
      code: SpanStatusCode.ERROR,
      message: error.message,
    });
  }
}

/**
 * Creates a child span within the current context
 */
export function createChildSpan(name: string, attributes?: Record<string, string | number | boolean>): Span {
  return tracer.startSpan(name, { attributes }, context.active());
}

/**
 * Helper function to instrument API routes with request/response information
 */
export function instrumentAPIRoute<T>(
  routeName: string,
  handler: () => Promise<T>,
  requestInfo?: {
    method?: string;
    url?: string;
    userAgent?: string;
  }
): Promise<T> {
  const attributes: Record<string, string | number | boolean> = {
    'api.route.name': routeName,
  };

  if (requestInfo) {
    if (requestInfo.method) attributes['http.method'] = requestInfo.method;
    if (requestInfo.url) attributes['http.url'] = requestInfo.url;
    if (requestInfo.userAgent) attributes['http.user_agent'] = requestInfo.userAgent;
  }

  return instrumentedFunction(`api.${routeName}`, handler, attributes);
}