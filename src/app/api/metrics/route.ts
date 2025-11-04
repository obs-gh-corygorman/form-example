import { NextResponse } from "next/server";
import { trace, context, SpanStatusCode, metrics } from "@opentelemetry/api";
import { logs, SeverityNumber } from "@opentelemetry/api-logs";

export async function GET() {
  const tracer = trace.getTracer("form-example");
  const logger = logs.getLogger("form-example");
  const meter = metrics.getMeter("form-example");
  
  const span = tracer.startSpan("metrics_endpoint");
  
  try {
    // Set span in context
    trace.setSpan(context.active(), span);
    
    // Create metrics
    const requestCounter = meter.createCounter("api_requests_total", {
      description: "Total number of API requests",
    });
    
    const responseTimeHistogram = meter.createHistogram("api_response_time", {
      description: "API response time in milliseconds",
      unit: "ms",
    });
    
    const startTime = Date.now();
    
    // Increment request counter
    requestCounter.add(1, {
      method: "GET",
      endpoint: "/api/metrics",
      status: "success",
    });
    
    // Add span attributes
    span.setAttributes({
      "http.method": "GET",
      "http.route": "/api/metrics",
      "service.name": "form-example",
    });
    
    // Simulate some processing time
    await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
    
    const responseTime = Date.now() - startTime;
    
    // Record response time
    responseTimeHistogram.record(responseTime, {
      method: "GET",
      endpoint: "/api/metrics",
    });
    
    // Log metrics access
    logger.emit({
      severityNumber: SeverityNumber.INFO,
      severityText: "INFO",
      body: "Metrics endpoint accessed",
      attributes: {
        "http.method": "GET",
        "http.route": "/api/metrics",
        "response_time_ms": responseTime,
        "timestamp": new Date().toISOString(),
      },
    });
    
    const metricsData = {
      status: "success",
      timestamp: new Date().toISOString(),
      response_time_ms: responseTime,
      service: "form-example",
      metrics: {
        requests_total: "Counter for total API requests",
        response_time: "Histogram for API response times",
      },
    };
    
    // Set successful status
    span.setStatus({ code: SpanStatusCode.OK });
    
    return NextResponse.json(metricsData);
  } catch (error) {
    // Log error
    logger.emit({
      severityNumber: SeverityNumber.ERROR,
      severityText: "ERROR",
      body: "Metrics endpoint failed",
      attributes: {
        error: (error as Error).message,
      },
    });
    
    // Set error status on span
    span.setStatus({ 
      code: SpanStatusCode.ERROR, 
      message: (error as Error).message 
    });
    
    return NextResponse.json(
      { status: "error", error: (error as Error).message },
      { status: 500 }
    );
  } finally {
    // End the span
    span.end();
  }
}
