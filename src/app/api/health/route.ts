import { NextResponse } from "next/server";
import { trace, SpanStatusCode } from "@opentelemetry/api";
import { SeverityNumber } from "@opentelemetry/api-logs";

export async function GET() {
  const tracer = trace.getTracer("form-example");
  
  return tracer.startActiveSpan("health.check", async (span) => {
    try {
      const healthData = {
        status: "healthy",
        timestamp: new Date().toISOString(),
        service: "form-example",
        version: "1.0.0",
        uptime: process.uptime(),
        memory: process.memoryUsage(),
      };

      // Set span attributes
      span.setAttributes({
        "health.status": "healthy",
        "health.uptime": process.uptime(),
        "health.memory.used": process.memoryUsage().heapUsed,
        "health.memory.total": process.memoryUsage().heapTotal,
      });

      // Log health check
      try {
        const { logger } = await import("../../../../otel-server");
        logger.emit({
          severityNumber: SeverityNumber.DEBUG,
          severityText: "DEBUG",
          body: "Health check performed",
          attributes: {
            "health.status": "healthy",
            "health.uptime": process.uptime(),
          },
        });
      } catch {
        // Fallback if otel-server import fails
        console.log("Health check performed - OpenTelemetry not available");
      }

      span.setStatus({ code: SpanStatusCode.OK });
      return NextResponse.json(healthData, { status: 200 });
    } catch (error) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: (error as Error).message,
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
            error: (error as Error).message,
          },
        });
      } catch {
        console.error("Health check failed:", error);
      }

      return NextResponse.json(
        { status: "unhealthy", error: (error as Error).message },
        { status: 500 }
      );
    } finally {
      span.end();
    }
  });
}
