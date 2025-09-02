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
const serviceName = "form-example-client";

// Next.js client-side environment variables
const otlpEndpoint =
  process.env.NEXT_PUBLIC_OTEL_EXPORTER_OTLP_ENDPOINT ||
  process.env.OTEL_EXPORTER_OTLP_ENDPOINT ||
  "http://localhost:4318";

const otlpEndpointBearerToken =
  process.env.NEXT_PUBLIC_OTEL_EXPORTER_OTLP_BEARER_TOKEN ||
  process.env.OTEL_EXPORTER_OTLP_BEARER_TOKEN;

const authHeaders: Record<string, string> = otlpEndpointBearerToken
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
          ...authHeaders,
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
          ...authHeaders,
          "x-observe-target-package": "Logs",
        },
      })
    ),
  ],
});

let isInitialized = false;
let otelComponents: { tracer: Tracer; logger: Logger; meter: Meter } | null = null;

// Initialize OpenTelemetry and return initialized components
export function initOtel(): { tracer: Tracer; logger: Logger; meter: Meter } {
  if (isInitialized && otelComponents) {
    return otelComponents;
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
    const tracer = trace.getTracer(serviceName);
    const logger = loggerProvider.getLogger(serviceName);
    const meter = metrics.getMeter(serviceName);

    logs.setGlobalLoggerProvider(loggerProvider);

    logger.emit({
      severityNumber: SeverityNumber.INFO,
      severityText: "INFO",
      body: "OpenTelemetry Web SDK started for form-example",
      attributes: {
        service: serviceName,
        endpoint: otlpEndpoint,
      },
    });

    otelComponents = { tracer, logger, meter };
    isInitialized = true;

    return otelComponents;
  } catch (error) {
    const logger = loggerProvider.getLogger(serviceName);
    logger.emit({
      severityNumber: SeverityNumber.ERROR,
      severityText: "ERROR",
      body: "Error starting OpenTelemetry SDK",
      attributes: { error: (error as Error).message },
    });
    throw error;
  }
}

// Export individual components for convenience
export function getTracer(): Tracer {
  if (!otelComponents) {
    initOtel();
  }
  return otelComponents!.tracer;
}

export function getLogger(): Logger {
  if (!otelComponents) {
    initOtel();
  }
  return otelComponents!.logger;
}

export function getMeter(): Meter {
  if (!otelComponents) {
    initOtel();
  }
  return otelComponents!.meter;
}
