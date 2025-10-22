import { NextResponse } from "next/server";
import { trace, SpanStatusCode } from "@opentelemetry/api";
import { SeverityNumber } from "@opentelemetry/api-logs";
import { logger } from "../../../../otel-server";

export async function GET() {
  const tracer = trace.getTracer("form-example");
  
  return tracer.startActiveSpan("health.check", async (span) => {
    try {
      const startTime = Date.now();
      
      // Set span attributes
      span.setAttributes({
        "http.method": "GET",
        "http.route": "/api/health",
        "service.name": "form-example",
      });

      // Simulate health checks (in a real app, you might check database, external services, etc.)
      const healthStatus = {
        status: "healthy",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: process.env.npm_package_version || "unknown",
      };

      const duration = Date.now() - startTime;

      // Log successful health check
      logger.emit({
        severityNumber: SeverityNumber.INFO,
        severityText: "INFO",
        body: "Health check completed",
        attributes: {
          "health.status": healthStatus.status,
          "health.duration_ms": duration,
          "health.uptime": healthStatus.uptime,
        },
      });

      span.setAttributes({
        "health.status": healthStatus.status,
        "health.duration_ms": duration,
      });

      span.setStatus({ code: SpanStatusCode.OK });

      return NextResponse.json(healthStatus, { status: 200 });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      
      // Set span status and record exception
      span.setStatus({ 
        code: SpanStatusCode.ERROR, 
        message: errorMessage 
      });
      
      if (error instanceof Error) {
        span.recordException(error);
      }

      // Log error
      logger.emit({
        severityNumber: SeverityNumber.ERROR,
        severityText: "ERROR",
        body: "Health check failed",
        attributes: {
          error: errorMessage,
        },
      });

      return NextResponse.json(
        { 
          status: "unhealthy", 
          error: errorMessage,
          timestamp: new Date().toISOString(),
        },
        { status: 500 }
      );
    } finally {
      span.end();
    }
  });
}
