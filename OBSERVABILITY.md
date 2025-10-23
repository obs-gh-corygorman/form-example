# Observability Setup

This project has been instrumented with OpenTelemetry for comprehensive observability including tracing, metrics, and logging.

## Overview

The observability setup includes:

- **Distributed Tracing**: Automatic instrumentation for HTTP requests, Next.js routing, and custom spans
- **Metrics Collection**: Form submission counters and performance metrics
- **Structured Logging**: Application events with trace correlation
- **Error Tracking**: Exception monitoring and error spans

## Configuration

### Environment Variables

Set these environment variables to configure the OpenTelemetry exporters:

```bash
# Server-side (required for server instrumentation)
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
OTEL_EXPORTER_OTLP_BEARER_TOKEN=your_token_here

# Client-side (required for browser instrumentation)
NEXT_PUBLIC_OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
NEXT_PUBLIC_OTEL_EXPORTER_OTLP_BEARER_TOKEN=your_token_here
```

### Default Configuration

If no environment variables are set, the system defaults to:
- Endpoint: `http://localhost:4318`
- No authentication

## Architecture

### Server-Side Instrumentation

- **File**: `otel-server.ts`
- **Initialization**: `instrumentation.ts` (Next.js instrumentation hook)
- **Features**:
  - Automatic HTTP request tracing
  - Database query instrumentation (if applicable)
  - Custom metrics and logging
  - OTLP export for traces, metrics, and logs

### Client-Side Instrumentation

- **File**: `otel-client.ts`
- **Initialization**: `src/components/otel-client-init.tsx`
- **Features**:
  - Document load instrumentation
  - Fetch/XHR request tracing
  - User interaction metrics
  - Browser performance monitoring

## Instrumented Features

### Form Submissions

The contact form includes:
- **Metrics**: `form_submissions_total` counter with labels for interest type and status
- **Logging**: Structured logs with form data (excluding sensitive information)
- **Tracing**: Automatic span creation for form submission events

### Automatic Instrumentation

The following are automatically instrumented:
- HTTP requests and responses
- Next.js page navigation
- API route calls
- Database operations (when applicable)
- External service calls

## Observability Data

### Traces

Traces capture the flow of requests through the application:
- HTTP request spans
- Form submission spans
- Database query spans (if applicable)
- External API call spans

### Metrics

Key metrics collected:
- `form_submissions_total`: Counter for form submissions
- HTTP request duration and count
- Page load times
- Error rates

### Logs

Structured logs include:
- Application events
- Form submissions
- Error messages
- Performance data
- Trace correlation IDs

## Development

### Running Locally

1. Start your OpenTelemetry Collector or compatible backend on port 4318
2. Set environment variables (optional)
3. Run the development server:

```bash
npm run dev
```

### Viewing Telemetry Data

The application exports telemetry data in OTLP format to the configured endpoint. You can use:

- **Jaeger** for distributed tracing
- **Prometheus** for metrics
- **Grafana** for visualization
- **Observe** for unified observability

### Testing Observability

1. Submit the form to generate telemetry data
2. Check your observability backend for:
   - Form submission traces
   - Metrics increments
   - Structured log entries

## Production Considerations

### Performance

- Batch processing is configured for optimal performance
- Sampling can be configured via environment variables
- Instrumentation overhead is minimal

### Security

- Bearer token authentication is supported
- Sensitive form data is not logged
- HTTPS endpoints are recommended for production

### Monitoring

Key things to monitor:
- Form submission success rates
- Page load performance
- Error rates and types
- User interaction patterns

## Troubleshooting

### Common Issues

1. **No telemetry data**: Check endpoint configuration and network connectivity
2. **Build errors**: Ensure all OpenTelemetry dependencies are installed
3. **Type errors**: Verify TypeScript types are correctly imported

### Debug Mode

Enable debug logging by setting:
```bash
OTEL_LOG_LEVEL=debug
```

## Files Added/Modified

- `otel-server.ts` - Server-side OpenTelemetry configuration
- `otel-client.ts` - Client-side OpenTelemetry configuration
- `instrumentation.ts` - Next.js instrumentation hook
- `src/components/otel-client-init.tsx` - Client initialization component
- `src/app/layout.tsx` - Updated to include client initialization
- `src/app/page.tsx` - Added form submission instrumentation
- `package.json` - Added OpenTelemetry dependencies

## Next Steps

1. Configure your observability backend
2. Set up dashboards and alerts
3. Add custom metrics for business KPIs
4. Implement error tracking workflows
5. Set up performance monitoring alerts
