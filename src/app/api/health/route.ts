import { NextResponse } from "next/server";
import { trace, SpanStatusCode } from "@opentelemetry/api";
import { SeverityNumber } from "@opentelemetry/api-logs";

export async function GET() {
  const tracer = trace.getTracer("form-example");
  const span = tracer.startSpan("health.check");

  try {
    const healthData = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      service: "form-example",
      version: "0.1.0",
    };

    span.setAttributes({
      "health.status": "healthy",
      "health.timestamp": healthData.timestamp,
    });

    // Log health check
    try {
      const { logger } = await import("../../../../otel-server");
      logger.emit({
        severityNumber: SeverityNumber.INFO,
        severityText: "INFO",
        body: "Health check performed",
        attributes: {
          status: "healthy",
          timestamp: healthData.timestamp,
        },
      });
    } catch {
      // Fallback if server logger is not available
      console.log("Health check performed:", healthData);
    }

    span.setStatus({ code: SpanStatusCode.OK });
    return NextResponse.json(healthData, { status: 200 });
  } catch (error) {
    span.setStatus({
      code: SpanStatusCode.ERROR,
      message: error instanceof Error ? error.message : "Unknown error",
    });
    span.recordException(error as Error);

    // Log error
    try {
      const { logger } = await import("../../../../otel-server");
      logger.emit({
        severityNumber: SeverityNumber.ERROR,
        severityText: "ERROR",
        body: "Health check failed",
        attributes: {
          error: error instanceof Error ? error.message : "Unknown error",
        },
      });
    } catch {
      // Fallback if server logger is not available
      console.error("Health check failed:", error);
    }

    return NextResponse.json(
      { status: "unhealthy", error: "Health check failed" },
      { status: 500 }
    );
  } finally {
    span.end();
  }
}
