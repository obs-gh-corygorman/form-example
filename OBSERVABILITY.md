# Observability Setup

This application is instrumented with OpenTelemetry for comprehensive observability including tracing, metrics, and logging.

## Features

### 🔍 Distributed Tracing
- Automatic instrumentation for HTTP requests, fetch calls, and document load events
- Custom spans for form submissions and validation
- Trace correlation across client and server components

### 📊 Metrics Collection
- Form submission success/failure rates
- Form validation error counts and types
- Form completion time tracking
- User interaction patterns
- System health metrics (memory usage, uptime)

### 📝 Structured Logging
- Correlated logs with trace and span IDs
- Form submission events and errors
- Validation error tracking
- Health check logging

### 🏥 Health Monitoring
- Health check endpoint at `/api/health`
- System metrics (uptime, memory usage)
- Service status monitoring

## Configuration

### Environment Variables

Copy `.env.example` to `.env.local` and configure:

```bash
# OpenTelemetry Collector endpoint
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
NEXT_PUBLIC_OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318

# Optional authentication
OTEL_EXPORTER_OTLP_BEARER_TOKEN=your-token-here
NEXT_PUBLIC_OTEL_EXPORTER_OTLP_BEARER_TOKEN=your-token-here
```

### OpenTelemetry Collector Setup

To receive telemetry data, you need an OpenTelemetry Collector running. Here's a basic configuration:

```yaml
# otel-collector.yaml
receivers:
  otlp:
    protocols:
      grpc:
        endpoint: 0.0.0.0:4317
      http:
        endpoint: 0.0.0.0:4318

processors:
  batch:

exporters:
  logging:
    loglevel: debug
  # Add your preferred exporters here (Jaeger, Prometheus, etc.)

service:
  pipelines:
    traces:
      receivers: [otlp]
      processors: [batch]
      exporters: [logging]
    metrics:
      receivers: [otlp]
      processors: [batch]
      exporters: [logging]
    logs:
      receivers: [otlp]
      processors: [batch]
      exporters: [logging]
```

Run with Docker:
```bash
docker run -p 4317:4317 -p 4318:4318 -v $(pwd)/otel-collector.yaml:/etc/otel-collector-config.yaml otel/opentelemetry-collector:latest --config=/etc/otel-collector-config.yaml
```

## Instrumentation Details

### Client-Side Instrumentation
- **File**: `otel-client.ts`
- **Initialization**: `src/components/providers/otel-client-init.tsx`
- **Automatic**: Document load, fetch requests, XHR requests
- **Manual**: Form submissions, validation errors

### Server-Side Instrumentation
- **File**: `otel-server.ts`
- **Initialization**: `instrumentation.ts`
- **Automatic**: HTTP requests, Next.js API routes
- **Manual**: Health checks, custom business logic

### Metrics Collected

| Metric | Type | Description |
|--------|------|-------------|
| `form_submissions_total` | Counter | Total form submissions by interest and success status |
| `form_validation_errors_total` | Counter | Total validation errors by field |
| `form_interactions_total` | Counter | Total form field interactions |
| `form_completion_time_seconds` | Histogram | Time to complete and submit form |

### Trace Attributes

| Attribute | Description |
|-----------|-------------|
| `form.interest` | Selected interest (Frontend/Backend/Fullstack) |
| `form.message_length` | Length of message field |
| `form.has_terms_accepted` | Whether terms were accepted |
| `user.email_domain` | Domain part of email address |
| `form.completion_time_seconds` | Time taken to complete form |

## Monitoring Queries

### Example Observe Queries

**Form Submission Success Rate:**
```sql
SELECT 
  interest,
  COUNT(*) as total_submissions,
  SUM(CASE WHEN success = 'true' THEN 1 ELSE 0 END) as successful_submissions,
  (SUM(CASE WHEN success = 'true' THEN 1 ELSE 0 END) * 100.0 / COUNT(*)) as success_rate
FROM form_submissions_total
GROUP BY interest
```

**Average Form Completion Time:**
```sql
SELECT 
  interest,
  AVG(form_completion_time_seconds) as avg_completion_time,
  PERCENTILE(form_completion_time_seconds, 0.95) as p95_completion_time
FROM form_completion_time_seconds
GROUP BY interest
```

**Most Common Validation Errors:**
```sql
SELECT 
  error_fields,
  COUNT(*) as error_count
FROM form_validation_errors_total
GROUP BY error_fields
ORDER BY error_count DESC
```

## Development

### Running with Observability

1. Start OpenTelemetry Collector (see configuration above)
2. Set environment variables in `.env.local`
3. Run the application:
   ```bash
   npm run dev
   ```
4. Access health check: http://localhost:3000/api/health
5. Submit forms to generate telemetry data

### Debugging

- Check browser console for client-side telemetry initialization
- Verify collector is receiving data at http://localhost:4318
- Health check endpoint provides service status
- Use browser dev tools to inspect OpenTelemetry spans

## Production Considerations

1. **Performance**: Instrumentation adds minimal overhead (~1-2ms per request)
2. **Sampling**: Consider implementing trace sampling for high-traffic applications
3. **Security**: Use authentication tokens for production OTLP endpoints
4. **Storage**: Configure appropriate retention policies for telemetry data
5. **Alerting**: Set up alerts based on error rates and performance metrics

## Troubleshooting

### Common Issues

1. **No telemetry data**: Check OTLP endpoint configuration and network connectivity
2. **Client-side errors**: Ensure NEXT_PUBLIC_ prefixed environment variables are set
3. **Import errors**: Verify all OpenTelemetry packages are installed
4. **CORS issues**: Configure OTLP collector to allow cross-origin requests

### Debug Mode

Enable debug logging by setting:
```bash
OTEL_LOG_LEVEL=debug
```
