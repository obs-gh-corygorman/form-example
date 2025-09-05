"use client";

import { useEffect, useState } from "react";
import { SeverityNumber } from "@opentelemetry/api-logs";

interface Logger {
  emit: (logRecord: {
    severityNumber: number;
    severityText: string;
    body: string;
    attributes?: Record<string, unknown>;
  }) => void;
}

interface Span {
  setAttributes: (attributes: Record<string, unknown>) => void;
  setStatus: (status: { code: number; message?: string }) => void;
  end: () => void;
}

interface Tracer {
  startSpan: (name: string) => Span;
}

export function useFormTelemetry() {
  const [logger, setLogger] = useState<Logger | null>(null);
  const [tracer, setTracer] = useState<Tracer | null>(null);
  const [otelReady, setOtelReady] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      import("../../otel-client").then(({ logger: clientLogger, tracer: clientTracer }) => {
        setLogger(clientLogger as Logger);
        setTracer(clientTracer as Tracer);
        setOtelReady(true);
      });
    }
  }, []);

  const logValidationError = (fieldName: string, errorMessage: string) => {
    if (!otelReady || !logger) return;

    logger.emit({
      severityNumber: SeverityNumber.WARN,
      severityText: "WARN",
      body: "Form validation error",
      attributes: {
        "validation.field": fieldName,
        "validation.error": errorMessage,
        "event.type": "form_validation_error",
      },
    });
  };

  const logFieldInteraction = (fieldName: string, action: string) => {
    if (!otelReady || !logger) return;

    logger.emit({
      severityNumber: SeverityNumber.DEBUG,
      severityText: "DEBUG",
      body: "Form field interaction",
      attributes: {
        "form.field": fieldName,
        "form.action": action,
        "event.type": "form_field_interaction",
      },
    });
  };

  return {
    otelReady,
    logger,
    tracer,
    logValidationError,
    logFieldInteraction,
  };
}
