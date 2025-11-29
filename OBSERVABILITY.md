# Observability Setup

This project includes comprehensive observability instrumentation using OpenTelemetry (OTel) for distributed tracing, metrics collection, and structured logging.

## Overview

The observability setup includes:

- **Distributed Tracing**: Automatic instrumentation for HTTP requests, database operations, and custom application spans
- **Structured Logging**: Correlated logs with trace and span IDs for better debugging
- **Metrics Collection**: Application performance metrics including request latency, throughput, and error rates
- **Error Tracking**: Automatic exception recording and error correlation
- **Client-Side Observability**: Browser-based tracing and logging for complete request visibility

## Architecture

### Server-Side Instrumentation
- **File**: `otel-server.ts`
- **Framework**: Node.js SDK with automatic instrumentation
- **Initialization**: `instrumentation.ts` (Next.js instrumentation hook)
- **Features**: 
  - Automatic HTTP request/response tracing
  - Database operation tracing
  - Custom span creation capabilities
  - Structured logging with trace correlation

### Client-Side Instrumentation
- **File**: `otel-client.ts`
- **Framework**: Web SDK with browser-specific instrumentation
- **Initialization**: `src/components/providers/otel-client-init.tsx`
- **Features**:
  - Document load performance tracking
  - Fetch/XHR request tracing
  - User interaction tracing
  - Client-side error tracking

## Configuration

### Environment Variables

Copy `.env.example` to `.env.local` and configure the following variables:

```bash
# Required: OTLP endpoint for telemetry data
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318

# Optional: Authentication token
OTEL_EXPORTER_OTLP_BEARER_TOKEN=your-token-here

# Client-side configuration (must use NEXT_PUBLIC_ prefix)
NEXT_PUBLIC_OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
NEXT_PUBLIC_OTEL_EXPORTER_OTLP_BEARER_TOKEN=your-token-here
```

### Service Configuration

The observability setup is configured for the following services:
- **Server Service**: `form-example`
- **Client Service**: `form-example-client`

## Usage Examples

### Custom Tracing

```typescript
import { trace, SpanStatusCode } from "@opentelemetry/api";

const tracer = trace.getTracer("your-service-name");

tracer.startActiveSpan("custom-operation", (span) => {
  try {
    // Your business logic here
    span.setAttributes({
      "operation.type": "form-submission",
      "user.id": "12345",
    });
    
    span.setStatus({ code: SpanStatusCode.OK });
  } catch (error) {
    span.setStatus({ 
      code: SpanStatusCode.ERROR, 
      message: error.message 
    });
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
import { logger } from "./otel-server"; // or "./otel-client" for client-side

logger.emit({
  severityNumber: SeverityNumber.INFO,
  severityText: "INFO",
  body: "Custom log message",
  attributes: {
    "user.id": "12345",
    "operation": "form-submission",
  },
});
```

### Custom Metrics

```typescript
import { metrics } from "@opentelemetry/api";

const meter = metrics.getMeter("your-service-name");
const counter = meter.createCounter("form_submissions_total", {
  description: "Total number of form submissions",
});

counter.add(1, {
  "form.type": "contact",
  "user.type": "authenticated",
});
```

## Observability Features

### Automatic Instrumentation

The setup automatically instruments:
- HTTP requests and responses
- Database queries (when database libraries are used)
- External API calls
- Document load performance (client-side)
- User interactions (client-side)

### Custom Instrumentation

The form submission includes custom observability:
- **Tracing**: Each form submission creates a span with form field attributes
- **Logging**: Structured logs for successful submissions and errors
- **Error Handling**: Automatic exception recording and correlation

### Health Monitoring

Key metrics automatically collected:
- Request latency and throughput
- Error rates and types
- Resource utilization
- Client-side performance metrics

## Integration with Observe

This setup is configured to work with Observe.com:

1. **OTLP Endpoint**: Configure your Observe OTLP endpoint
2. **Authentication**: Use bearer token authentication
3. **Data Routing**: Headers include `x-observe-target-package` for proper data routing
4. **Correlation**: Logs, traces, and metrics are automatically correlated

### Observe Configuration

```bash
# Set your Observe OTLP endpoint
OTEL_EXPORTER_OTLP_ENDPOINT=https://your-tenant.observe.com:443

# Set your Observe bearer token
OTEL_EXPORTER_OTLP_BEARER_TOKEN=your-observe-token
```

## Development

### Local Development

For local development, you can use a local OpenTelemetry Collector:

```bash
# Using Docker
docker run -p 4317:4317 -p 4318:4318 \
  otel/opentelemetry-collector-contrib:latest \
  --config-file=/etc/otel-collector-config.yaml
```

### Testing

The observability setup includes error handling to ensure it doesn't impact application functionality:
- Non-blocking initialization
- Graceful degradation on configuration errors
- Minimal performance overhead

## Troubleshooting

### Common Issues

1. **Build Errors**: Ensure all OpenTelemetry packages are installed
2. **Runtime Errors**: Check OTLP endpoint connectivity
3. **Missing Data**: Verify environment variable configuration
4. **Performance Impact**: Monitor batch processor settings

### Debug Mode

Enable debug logging by setting:
```bash
OTEL_LOG_LEVEL=debug
```

## Performance Considerations

- **Batch Processing**: Telemetry data is batched to minimize performance impact
- **Sampling**: Consider implementing sampling for high-traffic applications
- **Resource Limits**: Configure appropriate batch sizes and timeouts
- **Network**: Ensure reliable connectivity to your observability backend

## Security

- **Authentication**: Use bearer tokens for secure data transmission
- **Data Privacy**: Be mindful of sensitive data in span attributes and logs
- **Network Security**: Use HTTPS endpoints for production deployments
