# Observability Setup

This document describes the OpenTelemetry observability instrumentation added to the Form Example application.

## Overview

The application has been instrumented with OpenTelemetry to provide comprehensive observability including:

- **Distributed Tracing**: Track requests across client and server components
- **Structured Logging**: Centralized logging with trace correlation
- **Metrics Collection**: Application performance and business metrics
- **Error Tracking**: Automatic error capture and reporting

## Architecture

### Server-Side Instrumentation
- **File**: `otel-server.ts`
- **Runtime**: Node.js (Next.js server)
- **Auto-instrumentation**: HTTP requests, database calls, external APIs
- **Initialization**: `instrumentation.ts` (Next.js instrumentation hook)

### Client-Side Instrumentation  
- **File**: `otel-client.ts`
- **Runtime**: Browser (React components)
- **Auto-instrumentation**: Fetch requests, XHR, document load events
- **Initialization**: `src/components/providers/otel-client-init.tsx`

## Configuration

### Environment Variables

Copy `.env.example` to `.env.local` and configure:

```bash
# Server-side OTLP endpoint
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318

# Client-side OTLP endpoint (Next.js public env var)
NEXT_PUBLIC_OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318

# Optional: Authentication tokens
OTEL_EXPORTER_OTLP_BEARER_TOKEN=your_server_token
NEXT_PUBLIC_OTEL_EXPORTER_OTLP_BEARER_TOKEN=your_client_token
```

### Default Configuration

If no environment variables are set, the application defaults to:
- OTLP Endpoint: `http://localhost:4318`
- Service Names: `form-example` (server), `form-example-client` (client)

## Features Implemented

### 1. Automatic Instrumentation
- HTTP requests and responses
- Next.js framework operations
- Browser fetch/XHR requests
- Document load performance

### 2. Custom Instrumentation
- Form submission tracking with attributes:
  - `form.interest`: Selected interest (Frontend/Backend/Fullstack)
  - `form.message_length`: Length of message field
  - `form.has_terms_accepted`: Terms acceptance status
  - `user.email`: User email (in logs only)

### 3. Error Handling
- Automatic exception capture
- Error status codes in spans
- Structured error logging

### 4. Performance Monitoring
- Request latency tracking
- Resource usage metrics
- Client-side performance metrics

## Usage Examples

### Viewing Telemetry Data

1. **Start OpenTelemetry Collector** (example with Docker):
```bash
docker run -p 4317:4317 -p 4318:4318 \
  otel/opentelemetry-collector-contrib:latest
```

2. **Start the Application**:
```bash
npm run dev
```

3. **Generate Telemetry**:
   - Visit `http://localhost:3000`
   - Fill out and submit the form
   - Check your observability backend for traces, logs, and metrics

### Custom Instrumentation

To add custom spans in your code:

```typescript
import { trace, SpanStatusCode } from "@opentelemetry/api";

const tracer = trace.getTracer("your-service-name");

tracer.startActiveSpan("operation-name", (span) => {
  try {
    // Your business logic here
    span.setAttributes({
      "custom.attribute": "value",
    });
    span.setStatus({ code: SpanStatusCode.OK });
  } catch (error) {
    span.setStatus({ code: SpanStatusCode.ERROR });
    span.recordException(error);
    throw error;
  } finally {
    span.end();
  }
});
```

### Custom Logging

```typescript
import { SeverityNumber } from "@opentelemetry/api-logs";
import { logger } from "./otel-client"; // or "./otel-server"

logger.emit({
  severityNumber: SeverityNumber.INFO,
  severityText: "INFO",
  body: "Custom log message",
  attributes: {
    "custom.field": "value",
  },
});
```

## Integration with Observe

This setup is configured to work with Observe and other OpenTelemetry-compatible backends:

1. Set your Observe endpoint in environment variables
2. Add authentication tokens if required
3. The `x-observe-target-package` headers are included for Observe integration

## Troubleshooting

### Common Issues

1. **No telemetry data**: Check OTLP endpoint configuration
2. **Build errors**: Ensure all TypeScript types are correct
3. **Client-side issues**: Verify NEXT_PUBLIC_ environment variables

### Debug Mode

Enable debug logging by setting:
```bash
OTEL_LOG_LEVEL=debug
```

### Health Checks

The application automatically logs OpenTelemetry initialization:
- Server: "OpenTelemetry SDK started" 
- Client: "OpenTelemetry Web SDK started"

## Performance Considerations

- Minimal overhead: Auto-instrumentation is optimized for production
- Batch processing: Telemetry data is batched before export
- Error handling: Instrumentation failures don't affect application functionality
- Resource limits: Reasonable defaults for memory and CPU usage

## Next Steps

1. Configure your observability backend (Observe, Jaeger, etc.)
2. Set up dashboards and alerts
3. Add custom business metrics
4. Implement distributed tracing across services
5. Set up log aggregation and analysis
