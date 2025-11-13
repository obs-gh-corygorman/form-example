import { trace, context, SpanStatusCode, SpanKind } from "@opentelemetry/api";
import { SeverityNumber } from "@opentelemetry/api-logs";

// Re-export commonly used OpenTelemetry types and functions
export { trace, context, SpanStatusCode, SpanKind, SeverityNumber };

/**
 * Creates a span with automatic error handling and status setting
 */
export function withSpan<T>(
  name: string,
  fn: () => T | Promise<T>,
  attributes?: Record<string, string | number | boolean>
): T | Promise<T> {
  const tracer = trace.getTracer("default");
  const span = tracer.startSpan(name, {
    kind: SpanKind.INTERNAL,
    attributes,
  });

  try {
    const result = fn();
    
    // Handle both sync and async functions
    if (result instanceof Promise) {
      return result
        .then((value) => {
          span.setStatus({ code: SpanStatusCode.OK });
          return value;
        })
        .catch((error) => {
          span.setStatus({
            code: SpanStatusCode.ERROR,
            message: error.message,
          });
          span.recordException(error);
          throw error;
        })
        .finally(() => {
          span.end();
        });
    } else {
      span.setStatus({ code: SpanStatusCode.OK });
      span.end();
      return result;
    }
  } catch (error) {
    span.setStatus({
      code: SpanStatusCode.ERROR,
      message: (error as Error).message,
    });
    span.recordException(error as Error);
    span.end();
    throw error;
  }
}

/**
 * Adds attributes to the current active span
 */
export function addSpanAttributes(attributes: Record<string, string | number | boolean>): void {
  const span = trace.getActiveSpan();
  if (span) {
    span.setAttributes(attributes);
  }
}

/**
 * Records an event on the current active span
 */
export function recordSpanEvent(name: string, attributes?: Record<string, string | number | boolean>): void {
  const span = trace.getActiveSpan();
  if (span) {
    span.addEvent(name, attributes);
  }
}

/**
 * Gets the current trace ID for correlation
 */
export function getCurrentTraceId(): string | undefined {
  const span = trace.getActiveSpan();
  return span?.spanContext().traceId;
}

/**
 * Gets the current span ID for correlation
 */
export function getCurrentSpanId(): string | undefined {
  const span = trace.getActiveSpan();
  return span?.spanContext().spanId;
}

/**
 * Creates structured log attributes with trace correlation
 */
export function createLogAttributes(
  customAttributes: Record<string, string | number | boolean | undefined> = {}
): Record<string, string | number | boolean | undefined> {
  const traceId = getCurrentTraceId();
  const spanId = getCurrentSpanId();
  
  return {
    ...customAttributes,
    ...(traceId && { traceId }),
    ...(spanId && { spanId }),
    timestamp: new Date().toISOString(),
  };
}
