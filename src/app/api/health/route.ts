import { NextResponse } from "next/server";
import { trace, context, SpanStatusCode } from "@opentelemetry/api";
import { logs, SeverityNumber } from "@opentelemetry/api-logs";

export async function GET() {
  const tracer = trace.getTracer("form-example");
  const logger = logs.getLogger("form-example");
  
  // Start a span for health check
  const span = tracer.startSpan("health_check");
  
  try {
    // Set span in context
    trace.setSpan(context.active(), span);
    
    // Add span attributes
    span.setAttributes({
      "http.method": "GET",
      "http.route": "/api/health",
      "service.name": "form-example",
    });
    
    // Log health check
    logger.emit({
      severityNumber: SeverityNumber.INFO,
      severityText: "INFO",
      body: "Health check requested",
      attributes: {
        "http.method": "GET",
        "http.route": "/api/health",
      },
    });
    
    const healthData = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      service: "form-example",
      version: "0.1.0",
    };
    
    // Set successful status
    span.setStatus({ code: SpanStatusCode.OK });
    
    return NextResponse.json(healthData, { status: 200 });
  } catch (error) {
    // Log error
    logger.emit({
      severityNumber: SeverityNumber.ERROR,
      severityText: "ERROR",
      body: "Health check failed",
      attributes: { error: (error as Error).message },
    });
    
    // Set error status
    span.setStatus({ 
      code: SpanStatusCode.ERROR, 
      message: (error as Error).message 
    });
    
    return NextResponse.json(
      { status: "unhealthy", error: (error as Error).message },
      { status: 500 }
    );
  } finally {
    span.end();
  }
}
