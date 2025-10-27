import { NextResponse } from "next/server";
import { trace, SpanStatusCode } from "@opentelemetry/api";

export async function GET() {
  const tracer = trace.getTracer("form-example");
  
  return tracer.startActiveSpan("health.check", async (span) => {
    try {
      span.setAttributes({
        "http.method": "GET",
        "http.route": "/api/health",
        "service.name": "form-example",
      });

      const healthData = {
        status: "healthy",
        timestamp: new Date().toISOString(),
        service: "form-example",
        version: "0.1.0",
        uptime: process.uptime(),
      };

      // Log health check
      console.log("Health check performed", {
        "health.status": "healthy",
        "service.uptime": process.uptime(),
      });

      span.setStatus({ code: SpanStatusCode.OK });
      
      return NextResponse.json(healthData, { status: 200 });
    } catch (error) {
      span.setStatus({ 
        code: SpanStatusCode.ERROR, 
        message: error instanceof Error ? error.message : "Health check failed" 
      });
      span.recordException(error as Error);

      // Log error
      console.error("Health check failed", {
        error: error instanceof Error ? error.message : "Unknown error",
      });

      return NextResponse.json(
        { status: "unhealthy", error: "Health check failed" },
        { status: 500 }
      );
    } finally {
      span.end();
    }
  });
}
