# Observability Setup

This Next.js application has been instrumented with OpenTelemetry for comprehensive observability, including distributed tracing, metrics collection, and structured logging.

## Features

- **Automatic Instrumentation**: Server-side auto-instrumentation for HTTP requests, database calls, and other operations
- **Client-side Tracing**: Browser instrumentation for user interactions and API calls
- **Structured Logging**: Contextual logging with trace correlation
- **Health Monitoring**: Health check endpoint for application status
- **Observe Integration**: Pre-configured for Observe.com with custom headers

## Configuration

### Environment Variables

Copy `.env.example` to `.env.local` and configure the following variables:

```bash
# Server-side OTLP endpoint
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318

# Server-side bearer token (optional)
OTEL_EXPORTER_OTLP_BEARER_TOKEN=your-token-here

# Client-side OTLP endpoint (must be prefixed with NEXT_PUBLIC_)
NEXT_PUBLIC_OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318

# Client-side bearer token (optional)
NEXT_PUBLIC_OTEL_EXPORTER_OTLP_BEARER_TOKEN=your-token-here
```

### For Observe.com Integration

Set the endpoints to your Observe tenant:

```bash
OTEL_EXPORTER_OTLP_ENDPOINT=https://your-tenant.observeinc.com/v1/otel
NEXT_PUBLIC_OTEL_EXPORTER_OTLP_ENDPOINT=https://your-tenant.observeinc.com/v1/otel
```

## Architecture

### Server-side (`otel-server.ts`)
- Uses NodeSDK with automatic instrumentation
- Exports traces, metrics, and logs via OTLP HTTP
- Instruments HTTP requests, database calls, and other Node.js operations

### Client-side (`otel-client.ts`)
- Uses WebTracerProvider for browser instrumentation
- Instruments fetch requests, XHR, and document load events
- Exports telemetry data from the browser

### Instrumentation (`instrumentation.ts`)
- Next.js instrumentation hook for server-side initialization
- Automatically loads when the application starts

## Monitoring Endpoints

### Health Check
- **URL**: `/api/health`
- **Method**: GET
- **Response**: JSON with service status, timestamp, and version
- **Instrumented**: Yes (includes tracing and logging)

## Usage Examples

### Form Submission Tracing
The main form submission is fully instrumented with:
- Span creation with form data attributes
- Structured logging with severity levels
- Error handling and span status management

### Custom Instrumentation
To add custom tracing in your components:

```typescript
import { trace, context, SpanStatusCode } from "@opentelemetry/api";
import { logs, SeverityNumber } from "@opentelemetry/api-logs";

const tracer = trace.getTracer("your-service-name");
const logger = logs.getLogger("your-service-name");

const span = tracer.startSpan("operation_name");
try {
  trace.setSpan(context.active(), span);
  // Your code here
  span.setStatus({ code: SpanStatusCode.OK });
} catch (error) {
  span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
  throw error;
} finally {
  span.end();
}
```

## Development

The observability setup is non-intrusive and works in all environments:
- **Development**: Telemetry sent to localhost:4318 by default
- **Production**: Configure environment variables for your observability backend
- **Testing**: Instrumentation is automatically disabled in test environments

## Troubleshooting

1. **Build Errors**: Ensure all OpenTelemetry packages are installed
2. **Missing Telemetry**: Check environment variable configuration
3. **CORS Issues**: Ensure OTLP endpoint allows cross-origin requests for client-side data
4. **Performance**: Instrumentation overhead is minimal but can be disabled by not setting environment variables
