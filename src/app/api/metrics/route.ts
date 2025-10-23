import { NextResponse } from "next/server";
import { trace, SpanStatusCode, metrics } from "@opentelemetry/api";
import { SeverityNumber } from "@opentelemetry/api-logs";
import { logger } from "../../../../otel-server";

// Create metrics
const meter = metrics.getMeter("form-example-api");
const apiCallCounter = meter.createCounter("api_calls_total", {
  description: "Total number of API calls",
});
const apiDurationHistogram = meter.createHistogram("api_duration_ms", {
  description: "API call duration in milliseconds",
});

export async function GET() {
  const tracer = trace.getTracer("metrics-endpoint");
  const startTime = Date.now();
  
  return tracer.startActiveSpan("metrics-endpoint", async (span) => {
    try {
      // Increment API call counter
      apiCallCounter.add(1, {
        endpoint: "/api/metrics",
        method: "GET",
        status: "success",
      });

      const metricsData = {
        endpoint: "/api/metrics",
        timestamp: new Date().toISOString(),
        message: "Metrics endpoint - observability is working!",
        instrumentation: {
          traces: "enabled",
          metrics: "enabled", 
          logs: "enabled",
        },
      };

      // Log metrics endpoint access
      logger.emit({
        severityNumber: SeverityNumber.INFO,
        severityText: "INFO",
        body: "Metrics endpoint accessed",
        attributes: {
          endpoint: "/api/metrics",
          timestamp: metricsData.timestamp,
        },
      });

      // Set span attributes
      span.setAttributes({
        "http.method": "GET",
        "http.route": "/api/metrics",
        "endpoint.type": "metrics",
      });

      span.setStatus({ code: SpanStatusCode.OK });
      
      // Record API duration
      const duration = Date.now() - startTime;
      apiDurationHistogram.record(duration, {
        endpoint: "/api/metrics",
        method: "GET",
      });
      
      return NextResponse.json(metricsData, { status: 200 });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      
      // Increment error counter
      apiCallCounter.add(1, {
        endpoint: "/api/metrics",
        method: "GET", 
        status: "error",
      });
      
      // Log error
      logger.emit({
        severityNumber: SeverityNumber.ERROR,
        severityText: "ERROR",
        body: "Metrics endpoint failed",
        attributes: {
          endpoint: "/api/metrics",
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
        { status: "error", error: errorMessage },
        { status: 500 }
      );
    } finally {
      span.end();
    }
  });
}
