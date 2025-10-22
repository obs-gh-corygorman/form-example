# Observability Setup

This project includes comprehensive OpenTelemetry instrumentation for monitoring, tracing, and logging.

## Overview

The observability setup includes:

- **Distributed Tracing**: Automatic instrumentation for HTTP requests, form submissions, and user interactions
- **Structured Logging**: Centralized logging with trace correlation
- **Metrics Collection**: Performance metrics and business metrics
- **Error Tracking**: Exception monitoring and error correlation

## Architecture

### Server-Side Instrumentation
- **File**: `otel-server.ts`
- **Initialization**: `instrumentation.ts` (Next.js instrumentation hook)
- **Features**:
  - Automatic HTTP request tracing
  - Node.js runtime instrumentation
  - Database and external API call tracing (when applicable)
  - Structured logging with trace correlation

### Client-Side Instrumentation
- **File**: `otel-client.ts`
- **Initialization**: `src/components/providers/otel-client-init.tsx`
- **Features**:
  - Browser performance monitoring
  - User interaction tracing
  - Fetch/XHR request instrumentation
  - Client-side error tracking

## Configuration

### Environment Variables

Copy `.env.example` to `.env.local` and configure:

```bash
# Basic configuration
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
OTEL_EXPORTER_OTLP_BEARER_TOKEN=your-token-here

# Client-side configuration (Next.js)
NEXT_PUBLIC_OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
NEXT_PUBLIC_OTEL_EXPORTER_OTLP_BEARER_TOKEN=your-token-here
```

### Observe Integration

To integrate with Observe:

1. Set your Observe OTLP endpoint:
   ```bash
   OTEL_EXPORTER_OTLP_ENDPOINT=https://your-observe-instance.observeinc.com:443
   OTEL_EXPORTER_OTLP_BEARER_TOKEN=your-observe-token
   ```

2. Update client-side variables:
   ```bash
   NEXT_PUBLIC_OTEL_EXPORTER_OTLP_ENDPOINT=https://your-observe-instance.observeinc.com:443
   NEXT_PUBLIC_OTEL_EXPORTER_OTLP_BEARER_TOKEN=your-observe-token
   ```

## Features

### Automatic Instrumentation

The setup automatically instruments:

- **HTTP Requests**: All incoming and outgoing HTTP requests
- **Database Operations**: When database libraries are used
- **External API Calls**: Fetch, XMLHttpRequest, and Node.js HTTP clients
- **Framework Operations**: Next.js routing and rendering

### Custom Instrumentation

#### Form Submission Tracking

The form component includes custom instrumentation:

```typescript
// Traces form submissions with attributes
span.setAttributes({
  "form.interest": data.interest,
  "form.message_length": data.message.length,
  "form.terms_accepted": data.terms,
  "user.first_name": data.firstName,
  "user.last_name": data.lastName,
  "user.email": data.email,
});
```

#### Structured Logging

Logs include trace correlation:

```typescript
logger.emit({
  severityNumber: SeverityNumber.INFO,
  severityText: "INFO",
  body: "Form submitted successfully",
  attributes: {
    "form.interest": data.interest,
    "form.message_length": data.message.length,
    "user.email": data.email,
  },
});
```

### Error Handling

Errors are automatically:
- Recorded as span exceptions
- Logged with full context
- Correlated with traces
- Sent to the configured backend

## Development

### Local Testing

1. Start an OpenTelemetry Collector or compatible backend:
   ```bash
   # Using Docker with Jaeger
   docker run -d --name jaeger \
     -p 16686:16686 \
     -p 14250:14250 \
     -p 4317:4317 \
     -p 4318:4318 \
     jaegertracing/all-in-one:latest
   ```

2. Set environment variables:
   ```bash
   OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
   NEXT_PUBLIC_OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
   ```

3. Run the application:
   ```bash
   npm run dev
   ```

4. View traces at http://localhost:16686 (Jaeger UI)

### Debugging

Enable debug logging:
```bash
export OTEL_LOG_LEVEL=debug
```

## Production Deployment

### Performance Considerations

- Batch processors are configured for optimal performance
- Sampling can be configured via `OTEL_TRACES_SAMPLER`
- Resource usage is minimal with default configuration

### Security

- Use HTTPS endpoints in production
- Secure bearer tokens with proper secret management
- Consider network policies for OTLP traffic

### Monitoring

Key metrics to monitor:
- Trace export success rate
- Log export success rate
- Metric export success rate
- Instrumentation overhead

## Troubleshooting

### Common Issues

1. **No traces appearing**: Check OTLP endpoint connectivity
2. **Client-side errors**: Ensure NEXT_PUBLIC_ prefixed variables are set
3. **Build failures**: Verify all OpenTelemetry packages are installed
4. **Performance issues**: Adjust batch processor settings

### Debug Commands

```bash
# Check OpenTelemetry configuration
npm run build 2>&1 | grep -i otel

# Test OTLP endpoint connectivity
curl -X POST ${OTEL_EXPORTER_OTLP_ENDPOINT}/v1/traces \
  -H "Content-Type: application/x-protobuf" \
  -d ""
```

## Extending Instrumentation

### Adding Custom Metrics

```typescript
import { metrics } from "@opentelemetry/api";

const meter = metrics.getMeter("form-example");
const formSubmissionCounter = meter.createCounter("form_submissions_total");

// In your code
formSubmissionCounter.add(1, { interest: data.interest });
```

### Adding Custom Spans

```typescript
import { trace } from "@opentelemetry/api";

const tracer = trace.getTracer("form-example");
const span = tracer.startSpan("custom.operation");

try {
  // Your code here
  span.setAttributes({ "custom.attribute": "value" });
} finally {
  span.end();
}
```

## Support

For issues with the observability setup:
1. Check the troubleshooting section above
2. Review OpenTelemetry documentation
3. Verify environment configuration
4. Check network connectivity to OTLP endpoint
