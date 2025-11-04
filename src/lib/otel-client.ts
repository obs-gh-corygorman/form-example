import { Meter, metrics, trace, Tracer } from "@opentelemetry/api";
import { logs, Logger, SeverityNumber } from "@opentelemetry/api-logs";
import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-http";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { registerInstrumentations } from "@opentelemetry/instrumentation";
import { DocumentLoadInstrumentation } from "@opentelemetry/instrumentation-document-load";
import { FetchInstrumentation } from "@opentelemetry/instrumentation-fetch";
import { XMLHttpRequestInstrumentation } from "@opentelemetry/instrumentation-xml-http-request";
import { resourceFromAttributes } from "@opentelemetry/resources";
import {
  BatchLogRecordProcessor,
  LoggerProvider,
} from "@opentelemetry/sdk-logs";
import {
  SimpleSpanProcessor,
  WebTracerProvider,
} from "@opentelemetry/sdk-trace-web";
import { ATTR_SERVICE_NAME } from "@opentelemetry/semantic-conventions";

// Configuration
const serviceName = "form-example-nextjs-client"; // Next.js client application

// Next.js client-side environment variables (must be prefixed with NEXT_PUBLIC_)
const otlpEndpoint =
  process.env.NEXT_PUBLIC_OTEL_EXPORTER_OTLP_ENDPOINT ?? 
  process.env.OTEL_EXPORTER_OTLP_ENDPOINT ?? 
  "http://localhost:4318";
const otlpEndpointBearerToken = 
  process.env.NEXT_PUBLIC_OTEL_EXPORTER_OTLP_BEARER_TOKEN ??
  process.env.OTEL_EXPORTER_OTLP_BEARER_TOKEN;

const authHeader: Record<string, string> = otlpEndpointBearerToken
  ? { Authorization: `Bearer ${otlpEndpointBearerToken}` }
  : {};

// Create resource
const resource = resourceFromAttributes({
  [ATTR_SERVICE_NAME]: serviceName,
});

const provider = new WebTracerProvider({
  resource: resource,
  spanProcessors: [
    new SimpleSpanProcessor(
      new OTLPTraceExporter({
        url: `${otlpEndpoint}/v1/traces`,
        headers: {
          ...authHeader,
          "x-observe-target-package": "Tracing",
        },
      })
    ),
  ],
});

// Initialize Logger Provider
const loggerProvider = new LoggerProvider({
  resource: resource,
  processors: [
    new BatchLogRecordProcessor(
      new OTLPLogExporter({
        url: `${otlpEndpoint}/v1/logs`,
        headers: {
          ...authHeader,
          "x-observe-target-package": "Logs",
        },
      })
    ),
  ],
});

// Global instances
let tracer: Tracer;
let logger: Logger;
let meter: Meter;
let isInitialized = false;

// Initialize OpenTelemetry and return initialized components
export function initOtel(): { tracer: Tracer; logger: Logger; meter: Meter } {
  if (isInitialized) {
    return { tracer, logger, meter };
  }

  // Only initialize in browser environment
  if (typeof window === 'undefined') {
    // Return dummy instances for SSR
    return {
      tracer: {} as Tracer,
      logger: {} as Logger,
      meter: {} as Meter,
    };
  }

  try {
    // Registering instrumentations / plugins
    registerInstrumentations({
      instrumentations: [
        new DocumentLoadInstrumentation(),
        new FetchInstrumentation({
          ignoreUrls: [new RegExp(`.*${otlpEndpoint}.*`)],
        }),
        new XMLHttpRequestInstrumentation({
          ignoreUrls: [new RegExp(`.*${otlpEndpoint}.*`)],
        }),
      ],
    });

    provider.register({});

    // Initialize tracer, logger, and meter after SDK is started
    tracer = trace.getTracer(serviceName);
    logger = loggerProvider.getLogger(serviceName);
    meter = metrics.getMeter(serviceName);

    logs.setGlobalLoggerProvider(loggerProvider);

    logger.emit({
      severityNumber: SeverityNumber.INFO,
      severityText: "INFO",
      body: "OpenTelemetry Web SDK started for Next.js client",
      attributes: { 
        service: serviceName,
        userAgent: navigator.userAgent,
        url: window.location.href
      },
    });

    isInitialized = true;
    return { tracer, logger, meter };
  } catch (error) {
    const fallbackLogger = loggerProvider.getLogger(serviceName);
    fallbackLogger.emit({
      severityNumber: SeverityNumber.ERROR,
      severityText: "ERROR",
      body: "Error starting OpenTelemetry Web SDK",
      attributes: { error: (error as Error).message },
    });
    throw error;
  }
}

// Export initialized instances for use throughout the application
export { tracer, logger, meter };
