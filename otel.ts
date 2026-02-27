import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { Resource } from '@opentelemetry/resources';
import { SEMRESATTRS_SERVICE_NAME, SEMRESATTRS_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-node';
import { TraceIdRatioBasedSampler } from '@opentelemetry/sdk-trace-node';

// Environment configuration
const serviceName = process.env.OTEL_SERVICE_NAME || 'nextjs-app';
const serviceVersion = process.env.OTEL_SERVICE_VERSION || process.env.npm_package_version || '1.0.0';
const otlpEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318/v1/traces';
const bearerToken = process.env.OTEL_EXPORTER_OTLP_BEARER_TOKEN;

// Create OTLP trace exporter with bearer token authentication
const traceExporter = new OTLPTraceExporter({
  url: otlpEndpoint,
  headers: bearerToken ? {
    'Authorization': `Bearer ${bearerToken.replace('Authorization=Bearer ', '').replace('x-api-key=', '')}`,
    'Content-Type': 'application/json',
  } : {},
});

// Create resource with service information
const resource = new Resource({
  [SEMRESATTRS_SERVICE_NAME]: serviceName,
  [SEMRESATTRS_SERVICE_VERSION]: serviceVersion,
  'service.namespace': process.env.OTEL_SERVICE_NAMESPACE || 'production',
  'deployment.environment': process.env.NODE_ENV || 'development',
});

// Configure sampling (adjust rate based on environment)
const sampler = process.env.NODE_ENV === 'production' 
  ? new TraceIdRatioBasedSampler(0.1) // Sample 10% in production
  : new TraceIdRatioBasedSampler(1.0); // Sample 100% in development

// Create and configure the OpenTelemetry SDK
const sdk = new NodeSDK({
  resource,
  sampler,
  traceExporter,
  spanProcessors: [
    new BatchSpanProcessor(traceExporter, {
      // Batch configuration for optimal performance
      maxQueueSize: 1000,
      maxExportBatchSize: 100,
      scheduledDelayMillis: 1000,
      exportTimeoutMillis: 30000,
    }),
  ],
  instrumentations: [
    getNodeAutoInstrumentations({
      // Disable file system instrumentation to reduce noise
      '@opentelemetry/instrumentation-fs': {
        enabled: false,
      },
      // Configure HTTP instrumentation
      '@opentelemetry/instrumentation-http': {
        enabled: true,
        ignoredUrls: [
          /\/health/,
          /\/favicon\.ico/,
          /_next\/static/,
          /_next\/image/,
        ],
        requestHook: (span, request) => {
          // Add custom attributes to HTTP spans
          span.setAttributes({
            'http.request.header.user-agent': request.headers['user-agent'] || 'unknown',
            'http.request.header.x-forwarded-for': request.headers['x-forwarded-for'] || 'unknown',
          });
        },
      },
      // Configure undici instrumentation for fetch calls
      '@opentelemetry/instrumentation-undici': {
        enabled: true,
      },
      // Disable or configure other instrumentations as needed
      '@opentelemetry/instrumentation-dns': {
        enabled: false,
      },
      '@opentelemetry/instrumentation-net': {
        enabled: false,
      },
    }),
  ],
});

// Initialize the SDK
try {
  sdk.start();
  console.log('OpenTelemetry started successfully');
  
  // Graceful shutdown
  process.on('SIGTERM', async () => {
    try {
      await sdk.shutdown();
      console.log('OpenTelemetry shut down successfully');
    } catch (error) {
      console.error('Error shutting down OpenTelemetry', error);
    }
  });
} catch (error) {
  console.error('Error starting OpenTelemetry:', error);
}

export default sdk;