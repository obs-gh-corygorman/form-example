import { NextResponse } from "next/server";
import { trace, SpanStatusCode } from "@opentelemetry/api";
import { SeverityNumber } from "@opentelemetry/api-logs";
import { logger } from "../../../../otel-server";

export async function GET() {
  const tracer = trace.getTracer("health-check");
  
  return tracer.startActiveSpan("health-check", async (span) => {
    try {
      const healthData = {
        status: "healthy",
        timestamp: new Date().toISOString(),
        service: "form-example",
        version: "1.0.0",
      };

      // Log health check
      logger.emit({
        severityNumber: SeverityNumber.INFO,
        severityText: "INFO",
        body: "Health check endpoint accessed",
        attributes: {
          endpoint: "/api/health",
          status: "healthy",
          timestamp: healthData.timestamp,
        },
      });

      // Set span attributes
      span.setAttributes({
        "health.status": "healthy",
        "service.name": "form-example",
        "service.version": "1.0.0",
      });

      span.setStatus({ code: SpanStatusCode.OK });
      
      return NextResponse.json(healthData, { status: 200 });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      
      // Log error
      logger.emit({
        severityNumber: SeverityNumber.ERROR,
        severityText: "ERROR",
        body: "Health check failed",
        attributes: {
          endpoint: "/api/health",
          error: errorMessage,
        },
      });

      // Set error span status
      span.setStatus({ 
        code: SpanStatusCode.ERROR, 
        message: errorMessage 
      });
      span.recordException(error as Error);

      return NextResponse.json(
        { status: "unhealthy", error: errorMessage },
        { status: 500 }
      );
    } finally {
      span.end();
    }
  });
}
