import { NextResponse } from "next/server";
import { trace, SpanStatusCode } from "@opentelemetry/api";
import { SeverityNumber } from "@opentelemetry/api-logs";

export async function GET() {
  const tracer = trace.getTracer("form-example");
  const span = tracer.startSpan("metrics.get");

  try {
    // Basic metrics data - in a real application, this would come from your metrics provider
    const metricsData = {
      timestamp: new Date().toISOString(),
      service: "form-example",
      metrics: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: "0.1.0",
      },
    };

    span.setAttributes({
      "metrics.uptime": metricsData.metrics.uptime,
      "metrics.memory.heapUsed": metricsData.metrics.memory.heapUsed,
      "metrics.memory.heapTotal": metricsData.metrics.memory.heapTotal,
    });

    // Log metrics request
    try {
      const { logger } = await import("../../../../otel-server");
      logger.emit({
        severityNumber: SeverityNumber.INFO,
        severityText: "INFO",
        body: "Metrics endpoint accessed",
        attributes: {
          uptime: metricsData.metrics.uptime,
          memoryUsed: metricsData.metrics.memory.heapUsed,
        },
      });
    } catch {
      // Fallback if server logger is not available
      console.log("Metrics endpoint accessed:", metricsData);
    }

    span.setStatus({ code: SpanStatusCode.OK });
    return NextResponse.json(metricsData, { status: 200 });
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
        body: "Metrics endpoint failed",
        attributes: {
          error: error instanceof Error ? error.message : "Unknown error",
        },
      });
    } catch {
      // Fallback if server logger is not available
      console.error("Metrics endpoint failed:", error);
    }

    return NextResponse.json(
      { error: "Failed to retrieve metrics" },
      { status: 500 }
    );
  } finally {
    span.end();
  }
}
